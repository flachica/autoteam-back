import * as bcrypt from 'bcrypt';

export const saltAndHashPassword = async (
  password: string,
): Promise<string> => {
  const saltRounds = 10;
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(password, salt);
  return hashedPassword;
};
