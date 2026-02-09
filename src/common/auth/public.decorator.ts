import { SetMetadata } from '@nestjs/common';

/** 标记该接口为公开，不需要 JWT 鉴权 */
export const IS_PUBLIC = 'isPublic';

export const Public = () => SetMetadata(IS_PUBLIC, true);
