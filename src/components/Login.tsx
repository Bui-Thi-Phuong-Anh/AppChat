import { useState, type FormEvent } from "react";

type LoginProps = {
  onLogin: (userId: string) => void;
};

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!username.trim()) {
      setError("Vui lòng nhập email.");
      return;
    }

    if (!password.trim()) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    if (username.trim().toLowerCase() !== "han@gmail.com") {
      setError("Email không đúng.");
      return;
    }

    if (password !== "123456") {
      setError("Mật khẩu không đúng.");
      return;
    }

    onLogin("user-001");
  };


  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1>AppChat</h1>
        <p>Đăng nhập để tiếp tục trò chuyện</p>

        <label htmlFor="username">Email</label>
        <input id="username" type="email" value={username} onChange={(event) =>
            setUsername(event.target.value)} placeholder="Nhập địa chỉ email" required/>

        <label htmlFor="password">Mật khẩu</label>
        <input id="password" type="password" value={password} onChange={(event) =>
              setPassword(event.target.value)} placeholder="Nhập mật khẩu"/>

        {error && <p className="login-error">{error}</p>}

        <button type="submit">Đăng nhập</button>

        <small>Tài khoản demo: han@gmail.com / 123456</small>
      </form>
    </div>
  );
}