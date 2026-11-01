import { useState, type FormEvent } from "react";

type LoginProps = {
  onLogin: (userId: string) => void;
};

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setForgotMessage("");

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

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    setError("");
    setForgotMessage("");
  };

  const handleSendEmail = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setForgotMessage("Vui lòng nhập địa chỉ email.");
      return;
    }

    setForgotMessage(
        "Yêu cầu đã được ghi nhận. Chức năng gửi email cần được kết nối với backend."
    );
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

        <div className="forgot-password">
          <button type="button" onClick={handleForgotPassword}>
            Quên mật khẩu?
          </button>
        </div>

        {error && <p className="login-error">{error}</p>}

        <button type="submit">Đăng nhập</button>

        <small>Tài khoản demo: han@gmail.com / 123456</small>
      </form>
      {showForgotPassword && (
          <div className="forgot-overlay">
            <form className="forgot-form" onSubmit={handleSendEmail}>
              <h2>Quên mật khẩu?</h2>
              <p>Nhập email của bạn để yêu cầu khôi phục mật khẩu.</p>

              <label htmlFor="email">Địa chỉ email</label>
              <input id="email" type="email" value={email} onChange={(event) =>
                  setEmail(event.target.value)} placeholder="example@gmail.com" required/>

              {forgotMessage && (<p className="forgot-message">{forgotMessage}</p>)}

              <button type="submit">Gửi yêu cầu</button>

              <button type="button" className="cancel-button" onClick={() => {
                    setShowForgotPassword(false);
                    setForgotMessage("");}}>
                Quay lại đăng nhập
              </button>
            </form>
          </div>
      )}
    </div>
  );
}