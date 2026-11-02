export interface User {
	accepts(plain: string): Promise<boolean>;
}
