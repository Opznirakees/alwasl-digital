ALTER TABLE "countries" DROP CONSTRAINT IF EXISTS "countries_phone_code_format_check";

ALTER TABLE "countries"
  ADD CONSTRAINT "countries_phone_code_format_check"
  CHECK ("phoneCode" ~ '^\+[1-9][0-9]{0,8}$');
