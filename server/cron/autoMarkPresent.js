import cron from 'node-cron';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';

// Runs daily at 00:30 server time and marks the previous day as present
// for students who don't have an attendance record and are not on leave.
cron.schedule('1 0 * * *', async () => {
  try {
    console.log('[cron] autoMarkPresent: running job to mark previous day present');

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const students = await User.find({ role: 'student' }).select('_id hostelId');
    for (const s of students) {
      const exists = await Attendance.findOne({ studentId: s._id, date: yesterday });
      if (exists) {
        // if record exists and isOnLeave => skip
        if (exists.isOnLeave) continue;
        // if meals already recorded, skip
        if (exists.meals && exists.meals.length > 0) continue;
        // otherwise, update to mark all meals present
        exists.isOnLeave = false;
        exists.meals = [
          { mealType: 'breakfast', isPresent: true, markedAt: new Date(), markedBy: 'system' },
          { mealType: 'lunch', isPresent: true, markedAt: new Date(), markedBy: 'system' },
          { mealType: 'eveningSnacks', isPresent: true, markedAt: new Date(), markedBy: 'system' },
          { mealType: 'dinner', isPresent: true, markedAt: new Date(), markedBy: 'system' },
        ];
        await exists.save();
      } else {
        // create a new attendance record marking present for all meals
        const newRec = new Attendance({
          studentId: s._id,
          hostelId: s.hostelId,
          date: yesterday,
          isOnLeave: false,
          meals: [
            { mealType: 'breakfast', isPresent: true, markedAt: new Date(), markedBy: 'system' },
            { mealType: 'lunch', isPresent: true, markedAt: new Date(), markedBy: 'system' },
            { mealType: 'eveningSnacks', isPresent: true, markedAt: new Date(), markedBy: 'system' },
            { mealType: 'dinner', isPresent: true, markedAt: new Date(), markedBy: 'system' },
          ],
        });
        await newRec.save();
      }
    }

    console.log('[cron] autoMarkPresent: job completed');
  } catch (err) {
    console.error('[cron] autoMarkPresent error:', err.message || err);
  }
});

export default null;
