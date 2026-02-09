# Auth 接口 cURL 示例

默认 base URL：`http://localhost:3000`，可按需替换为 `BASE_URL`。

---

## 1. 获取验证码 GET /auth/v1/code

**Query**: `type`(CodeType) | `account` | `getType`(EMAIL/PHONE)

```bash
# 注册-邮箱验证码
curl -X GET "http://localhost:3000/auth/v1/code?type=REGISTER&account=user@example.com&getType=EMAIL"

# 忘记密码-邮箱验证码
curl -X GET "http://localhost:3000/auth/v1/code?type=FORGOT_PASSWORD&account=user@example.com&getType=EMAIL"

# 更换邮箱-向新邮箱发验证码
curl -X GET "http://localhost:3000/auth/v1/code?type=CHANGE_EMAIL&account=newemail@example.com&getType=EMAIL"
```

---

## 2. 校验验证码 GET /auth/v1/check-code

**Query**: `type` | `account` | `code`  
更换邮箱场景需带 token（登录后调用）。

```bash
# 通用校验（如忘记密码前一步）
curl -X GET "http://localhost:3000/auth/v1/check-code?type=FORGOT_PASSWORD&account=user@example.com&code=123456"

# 更换邮箱校验（需登录，带 token）
curl -X GET "http://localhost:3000/auth/v1/check-code?type=CHANGE_EMAIL&account=newemail@example.com&code=123456" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 3. 注册 POST /auth/v1/register

```bash
curl -X POST "http://localhost:3000/auth/v1/register" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "EMAIL",
    "account": "user@example.com",
    "username": "myuser",
    "password": "YourPassword123"
  }'
```

---

## 4. 登录 POST /auth/v1/login

```bash
curl -X POST "http://localhost:3000/auth/v1/login" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ACCOUNT",
    "account": "user@example.com",
    "password": "YourPassword123"
  }'
```

返回中的 `data.token` 用于后续鉴权接口。

---

## 5. 获取当前用户 GET /auth/v1/profile（需登录）

```bash
curl -X GET "http://localhost:3000/auth/v1/profile" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 6. 修改用户信息 PUT /auth/v1/profile（需登录）

```bash
curl -X PUT "http://localhost:3000/auth/v1/profile" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newname",
    "avatar": "https://example.com/avatar.png",
    "gender": 1
  }'
```

---

## 7. 忘记密码 POST /auth/v1/forgot-password

流程：先 getCode(FORGOT_PASSWORD) → checkCode → 再调本接口。

```bash
curl -X POST "http://localhost:3000/auth/v1/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{
    "account": "user@example.com",
    "newPassword": "NewPassword456"
  }'
```

---

## 8. 修改密码 PUT /auth/v1/password（需登录）

```bash
curl -X PUT "http://localhost:3000/auth/v1/password" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "YourPassword123",
    "newPassword": "NewPassword456"
  }'
```

---

## 9. 更换邮箱 PUT /auth/v1/email（需登录）

流程：先对 newEmail 调 getCode(CHANGE_EMAIL) → 带 token 调 checkCode → 再调本接口。

```bash
curl -X PUT "http://localhost:3000/auth/v1/email" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newEmail": "newemail@example.com"
  }'
```

---

## 10. 更换手机号 PUT /auth/v1/phone（需登录，当前为 TODO）

```bash
curl -X PUT "http://localhost:3000/auth/v1/phone" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newPhone": "13800138000"
  }'
```

---

## 枚举参考

- **LoginType**: `ACCOUNT` | `APPLE` | `GOOGLE` | `APPLET`
- **RegisterType**: `EMAIL` | `PHONE` | `GOOGLE` | `APPLE` | `APPLET`
- **CodeType**: `REGISTER` | `LOGIN` | `FORGOT_PASSWORD` | `CHANGE_EMAIL` | `CHANGE_PHONE` | `UPDATED_PASSWORD`
- **GetCodeType**: `EMAIL` | `PHONE`
