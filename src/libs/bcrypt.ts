import bcrypt from "bcryptjs";


const ROUNDS = 12;
export const hash = (plain: string) => bcrypt.hash(plain, ROUNDS);
export const verify = (plain: string, hash: string) => bcrypt.compare(plain, hash);