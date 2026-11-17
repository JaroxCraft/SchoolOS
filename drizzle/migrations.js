import journal from './meta/_journal.json';
import m0000 from './0000_init.sql';
import m0001 from './0001_teachers.sql';
import m0002 from './0002_drop_subject_teacher.sql';
import m0003 from './0003_subject_teacher_set_null.sql';
import m0004 from './0004_drop_study_start.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002,
m0003,
m0004
    }
  }
  