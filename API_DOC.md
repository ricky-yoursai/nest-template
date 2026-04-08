# API 接口文档

## 基础信息

| 项目 | 内容 |
| --- | --- |
| 服务地址 | `http://localhost:8001` |
| 模块前缀 | `auth/v1` |
| 完整示例 | `http://localhost:8001/auth/v1/login` |
| 请求类型 | `application/json` |
| 鉴权说明 | 受保护接口需携带 `Authorization: Bearer <token>` |

## 枚举值说明

| 枚举 | 可选值 |
| --- | --- |
| `RegisterType` | `EMAIL` \| `APPLE` \| `APPLET` \| `GOOGLE` \| `PHONE` |
| `LoginType` | `ACCOUNT` \| `APPLE` \| `APPLET` \| `GOOGLE` |
| `GetCodeType` | `EMAIL` \| `PHONE` |
| `CodeType` | `LOGIN` \| `REGISTER` \| `FORGOT_PASSWORD` \| `CHANGE_EMAIL` \| `CHANGE_PHONE` \| `UPDATED_PASSWORD` |

---

## 1）注册

| 字段 | 内容 |
| --- | --- |
| 请求方法 | `POST` |
| 请求路径 | `/auth/v1/register` |
| 是否鉴权 | 否 |
| 接口说明 | 按注册类型创建用户（常见为邮箱+验证码注册流程）。 |

### 参数（Body）

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `type` | string | 是 | 注册类型，见 `RegisterType` |
| `username` | string | 否 | 用户名 |
| `account` | string | 否 | 账号（邮箱/手机号/三方账号） |
| `password` | string | 否 | 密码 |
| `code` | string | 否 | 验证码 |

### cURL 示例

```bash
curl -X POST "http://localhost:8001/auth/v1/register" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "EMAIL",
    "username": "ricky",
    "account": "ricky@example.com",
    "password": "123456",
    "code": "123456"
  }'
```

---

## 2）获取验证码

| 字段 | 内容 |
| --- | --- |
| 请求方法 | `GET` |
| 请求路径 | `/auth/v1/code` |
| 是否鉴权 | 否 |
| 接口说明 | 向指定账号（邮箱/手机号）发送验证码，用于注册、登录、找回密码、换绑等流程。 |

### 参数（Query）

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `type` | string | 是 | 验证码业务类型，见 `CodeType` |
| `account` | string | 是 | 接收验证码的账号 |
| `getType` | string | 是 | 发送渠道，见 `GetCodeType` |

### cURL 示例

```bash
curl -G "http://localhost:8001/auth/v1/code" \
  --data-urlencode "type=REGISTER" \
  --data-urlencode "account=ricky@example.com" \
  --data-urlencode "getType=EMAIL"
```

---

## 3）校验验证码

| 字段 | 内容 |
| --- | --- |
| 请求方法 | `GET` |
| 请求路径 | `/auth/v1/check-code` |
| 是否鉴权 | 可选（某些场景需要登录后调用，如更换邮箱） |
| 接口说明 | 按业务类型和账号校验验证码是否有效。 |

### 参数（Query）

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `type` | string | 是 | 业务类型，见 `CodeType` |
| `account` | string | 是 | 接收验证码的账号 |
| `code` | string | 是 | 验证码 |

### cURL 示例（公开场景）

```bash
curl -G "http://localhost:8001/auth/v1/check-code" \
  --data-urlencode "type=FORGOT_PASSWORD" \
  --data-urlencode "account=ricky@example.com" \
  --data-urlencode "code=123456"
```

### cURL 示例（需登录场景，如更换邮箱）

```bash
curl -G "http://localhost:8001/auth/v1/check-code" \
  -H "Authorization: Bearer <token>" \
  --data-urlencode "type=CHANGE_EMAIL" \
  --data-urlencode "account=new_email@example.com" \
  --data-urlencode "code=123456"
```

---

## 4）登录

| 字段 | 内容 |
| --- | --- |
| 请求方法 | `POST` |
| 请求路径 | `/auth/v1/login` |
| 是否鉴权 | 否 |
| 接口说明 | 登录并返回 JWT token。 |

### 参数（Body）

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `type` | string | 是 | 登录类型，见 `LoginType` |
| `account` | string | 是 | 账号 |
| `password` | string | 是 | 密码 |

### cURL 示例

```bash
curl -X POST "http://localhost:8001/auth/v1/login" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ACCOUNT",
    "account": "ricky@example.com",
    "password": "123456"
  }'
```

---

## 5）获取当前用户信息

| 字段 | 内容 |
| --- | --- |
| 请求方法 | `GET` |
| 请求路径 | `/auth/v1/profile` |
| 是否鉴权 | 是 |
| 接口说明 | 获取当前登录用户在 token 中解析出的信息。 |

### cURL 示例

```bash
curl -X GET "http://localhost:8001/auth/v1/profile" \
  -H "Authorization: Bearer <token>"
```

---

## 6）更新用户信息

| 字段 | 内容 |
| --- | --- |
| 请求方法 | `PUT` |
| 请求路径 | `/auth/v1/profile` |
| 是否鉴权 | 是 |
| 接口说明 | 更新当前用户资料。更新成功后可能会清理缓存与 token，需重新登录。 |

### 参数（Body）

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `username` | string | 否 | 昵称 |
| `avatar` | string | 否 | 头像 URL |
| `gender` | number | 否 | 性别：`0` \| `1` \| `2` |
| `birthday` | string | 否 | 生日（字符串） |
| `country` | string | 否 | 国家 |
| `province` | string | 否 | 省份 |
| `city` | string | 否 | 城市 |
| `language` | string | 否 | 语言 |
| `timezone` | string | 否 | 时区 |

### cURL 示例

```bash
curl -X PUT "http://localhost:8001/auth/v1/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "username": "new_name",
    "avatar": "https://example.com/avatar.png",
    "gender": 1,
    "birthday": "1998-01-01",
    "country": "China",
    "province": "Guangdong",
    "city": "Shenzhen",
    "language": "zh-CN",
    "timezone": "Asia/Shanghai"
  }'
```

---

## 7）忘记密码（重置密码）

| 字段 | 内容 |
| --- | --- |
| 请求方法 | `POST` |
| 请求路径 | `/auth/v1/forgot-password` |
| 是否鉴权 | 否 |
| 接口说明 | 通过账号重置密码。建议流程：先 `getCode(FORGOT_PASSWORD)`，再 `check-code`，最后调本接口。 |

### 参数（Body）

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `account` | string | 是 | 账号 |
| `newPassword` | string | 是 | 新密码，最少 6 位 |

### cURL 示例

```bash
curl -X POST "http://localhost:8001/auth/v1/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "ricky@example.com",
    "newPassword": "newpass123"
  }'
```

---

## 8）修改密码（登录后）

| 字段 | 内容 |
| --- | --- |
| 请求方法 | `PUT` |
| 请求路径 | `/auth/v1/password` |
| 是否鉴权 | 是 |
| 接口说明 | 登录状态下修改密码，需要传旧密码校验。 |

### 参数（Body）

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `oldPassword` | string | 是 | 旧密码 |
| `newPassword` | string | 是 | 新密码，最少 6 位 |

### cURL 示例

```bash
curl -X PUT "http://localhost:8001/auth/v1/password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "oldPassword": "123456",
    "newPassword": "newpass123"
  }'
```

---

## 9）更换邮箱

| 字段 | 内容 |
| --- | --- |
| 请求方法 | `PUT` |
| 请求路径 | `/auth/v1/email` |
| 是否鉴权 | 是 |
| 接口说明 | 更换邮箱。建议流程：对新邮箱先 `getCode(CHANGE_EMAIL)`，再 `check-code`，最后调本接口。 |

### 参数（Body）

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `newEmail` | string | 是 | 新邮箱地址 |

### cURL 示例

```bash
curl -X PUT "http://localhost:8001/auth/v1/email" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "newEmail": "new_email@example.com"
  }'
```

---

## 10）更换手机号

| 字段 | 内容 |
| --- | --- |
| 请求方法 | `PUT` |
| 请求路径 | `/auth/v1/phone` |
| 是否鉴权 | 是 |
| 接口说明 | 更换手机号（当前代码中短信流程仍标记为 TODO）。 |

### 参数（Body）

| 参数名 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `newPhone` | string | 是 | 新手机号 |

### cURL 示例

```bash
curl -X PUT "http://localhost:8001/auth/v1/phone" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "newPhone": "13800138000"
  }'
```

---

## 快速联调流程（邮箱注册 + 登录）

| 步骤 | 说明 |
| --- | --- |
| 1 | 获取验证码 |
| 2 | 注册 |
| 3 | 登录 |

### 1）获取验证码

```bash
curl -G "http://localhost:8001/auth/v1/code" \
  --data-urlencode "type=REGISTER" \
  --data-urlencode "account=ricky@example.com" \
  --data-urlencode "getType=EMAIL"
```

### 2）注册

```bash
curl -X POST "http://localhost:8001/auth/v1/register" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "EMAIL",
    "username": "ricky",
    "account": "ricky@example.com",
    "password": "123456",
    "code": "123456"
  }'
```

### 3）登录

```bash
curl -X POST "http://localhost:8001/auth/v1/login" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ACCOUNT",
    "account": "ricky@example.com",
    "password": "123456"
  }'
```
