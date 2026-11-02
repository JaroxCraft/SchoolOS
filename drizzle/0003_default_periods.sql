-- Default period grid of the Oberstufe Uznach, only for databases without periods
INSERT INTO `periods` (`start_time`, `end_time`)
SELECT `column1`, `column2` FROM (VALUES
	('07:25', '08:15'),
	('08:15', '09:05'),
	('09:05', '09:55'),
	('10:15', '11:05'),
	('11:05', '11:55'),
	('11:55', '12:45'),
	('12:45', '13:35'),
	('13:40', '14:30'),
	('14:30', '15:20'),
	('15:35', '16:25'),
	('16:25', '17:15')
)
WHERE NOT EXISTS (SELECT 1 FROM `periods`);
