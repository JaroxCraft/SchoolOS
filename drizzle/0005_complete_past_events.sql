-- Exams, presentations and other entries can be checked off now instead of dropping out once their
-- date has passed. The past ones count as done, so they do not all show up as missed.
UPDATE `entries` SET `completed` = 1
WHERE `type` IN ('exam', 'presentation', 'other') AND `date` < date('now', 'localtime');
