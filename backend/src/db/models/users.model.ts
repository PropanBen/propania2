import type { Auditable } from './auditable.type';

export type DbUser = Auditable & {
	id?: string;
	name: string;
	email: string;
	pass?: string;
};
