UPDATE "countries"
SET "phoneCode" = CASE "code"
  WHEN 'AG' THEN '+1268'
  WHEN 'AI' THEN '+1264'
  WHEN 'AS' THEN '+1684'
  WHEN 'BB' THEN '+1246'
  WHEN 'BM' THEN '+1441'
  WHEN 'BS' THEN '+1242'
  WHEN 'CA' THEN '+1'
  WHEN 'DM' THEN '+1767'
  WHEN 'DO' THEN '+1809'
  WHEN 'GD' THEN '+1473'
  WHEN 'GU' THEN '+1671'
  WHEN 'JM' THEN '+1876'
  WHEN 'KN' THEN '+1869'
  WHEN 'KY' THEN '+1345'
  WHEN 'LC' THEN '+1758'
  WHEN 'MP' THEN '+1670'
  WHEN 'MS' THEN '+1664'
  WHEN 'PR' THEN '+1787'
  WHEN 'SX' THEN '+1721'
  WHEN 'TC' THEN '+1649'
  WHEN 'TT' THEN '+1868'
  WHEN 'US' THEN '+1'
  WHEN 'VC' THEN '+1784'
  WHEN 'VG' THEN '+1284'
  WHEN 'VI' THEN '+1340'
  WHEN 'KZ' THEN '+7'
  WHEN 'RU' THEN '+7'
  ELSE "phoneCode"
END,
"updatedAt" = CURRENT_TIMESTAMP
WHERE "code" IN (
  'AG', 'AI', 'AS', 'BB', 'BM', 'BS', 'CA', 'DM', 'DO', 'GD', 'GU', 'JM', 'KN',
  'KY', 'LC', 'MP', 'MS', 'PR', 'SX', 'TC', 'TT', 'US', 'VC', 'VG', 'VI', 'KZ', 'RU'
);
