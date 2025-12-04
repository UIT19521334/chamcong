const PostgresDB = require('../lib/postgres');

// GET /api/attendance?userId=..&month=YYYY-MM
// Trả về danh sách bản ghi chấm công theo user + tháng, có kiểm tra quyền
async function getAttendanceByUserAndMonth(req, res) {
  const { userId, month } = req.query;

  if (!userId || !month) {
    return res.status(400).json({ success: false, message: 'Missing userId or month (YYYY-MM)' });
  }

  // month: "2025-12" => khoảng từ 2025-12-01 đến 2026-01-01 (exclusive)
  const [year, mon] = month.split('-');
  if (!year || !mon) {
    return res.status(400).json({ success: false, message: 'Invalid month format, expected YYYY-MM' });
  }

  const db = new PostgresDB();

  try {
    // Xác định user hiện tại và role để chặn user thường xem người khác
    const securityLevel = req.cookies.SECURITY_LEVEL || 'low';
    let currentUserRow = null;

    if (securityLevel === 'high') {
      if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }

      const resultMe = await db.query(
        'SELECT id, username, role FROM users WHERE username = $1',
        [req.session.user.username]
      );
      if (!resultMe.rows.length) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      currentUserRow = resultMe.rows[0];
    } else {
      const username = req.cookies.current_user;
      if (!username) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
      }

      const resultMe = await db.query(
        'SELECT id, username, role FROM users WHERE username = $1',
        [username]
      );
      if (!resultMe.rows.length) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }
      currentUserRow = resultMe.rows[0];
    }

    const requestedUserId = Number(userId);
    if (!Number.isInteger(requestedUserId)) {
      return res.status(400).json({ success: false, message: 'Invalid userId' });
    }

    // Nếu không phải admin thì chỉ được xem chính mình
    if (currentUserRow.role !== 'admin' && requestedUserId !== currentUserRow.id) {
      return res.status(403).json({ success: false, message: 'Forbidden: cannot view other users\' attendance' });
    }

    const startDate = `${year}-${mon}-01`;
    // dùng date_trunc để tăng 1 tháng
    const query = `
      SELECT
        a.work_date AS date,
        a.check_in,
        a.check_out,
        a.status,
        a.note
      FROM attendance a
      WHERE a.user_id = $1
        AND a.work_date >= $2::date
        AND a.work_date < (date_trunc('month', $2::date) + interval '1 month')
      ORDER BY a.work_date ASC
    `;

    const result = await db.query(query, [requestedUserId, startDate]);

    const records = result.rows.map((r) => ({
      date: r.date.toISOString().slice(0, 10),
      checkIn: r.check_in ? r.check_in.toISOString().slice(11, 16) : null,
      checkOut: r.check_out ? r.check_out.toISOString().slice(11, 16) : null,
      status: r.status,
      note: r.note || ''
    }));

    return res.json({ success: true, records });
  } catch (err) {
    console.error('Error querying attendance:', err);
    return res.status(500).json({ success: false, message: 'Database error', error: err.message });
  } finally {
    await db.close();
  }
}

module.exports = { getAttendanceByUserAndMonth };
