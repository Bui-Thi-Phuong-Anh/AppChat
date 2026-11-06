import { useState, type FormEvent } from "react";
import { websocketService } from "../services/websocket";

type LoginResponse = { RE_LOGIN_CODE?: string; mes?: string; message?: string; };
type LoginProps = { onLogin: (userId: string, reLoginCode: string) => void; onRegister: () => void; };

export function Login({ onLogin, onRegister }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setForgotMessage("");

    const user = username.trim();

    if (!user) {
      setError("Vui lòng nhập tài khoản.");
      return;
    }

    if (!password.trim()) {
      setError("Vui lòng nhập mật khẩu.");
      return;
    }

    if (loading) return;

    setLoading(true);

    let unsubscribe: (() => void) | undefined;

    try {
      await websocketService.connect();

      unsubscribe = websocketService.on("LOGIN", (message) => {
        const data = message.data as LoginResponse;

        setLoading(false);

        if (data?.RE_LOGIN_CODE) {
          unsubscribe?.();
          onLogin(user, data.RE_LOGIN_CODE);
          return;
        }

        setError(data?.mes || data?.message || "Tên đăng nhập hoặc mật khẩu không chính xác.");

        unsubscribe?.();
      });

      websocketService.send("LOGIN", {
        user,
        pass: password,
      });
    } catch (err) {
      unsubscribe?.();
      setLoading(false);

      setError(err instanceof Error ? err.message : "Không thể kết nối đến máy chủ. Vui lòng thử lại.");
    }
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

    setForgotMessage("Chức năng khôi phục mật khẩu hiện chưa được API hỗ trợ.");
  };

  return (<div className="login-page">
          <form className="login-form" onSubmit={handleSubmit}>
            <h1>AppChat</h1>
            <p>Đăng nhập để tiếp tục trò chuyện</p>

            <label htmlFor="username">Tài khoản</label>
            <input id="username" type="text" value={username} onChange={(event) =>
                setUsername(event.target.value)} placeholder="Nhập tên tài khoản" autoComplete="username" required/>

            <label htmlFor="password">Mật khẩu</label>
            <input id="password" type="password" value={password} onChange={(event) =>
                setPassword(event.target.value)} placeholder="Nhập mật khẩu" autoComplete="current-password" required/>

            <div className="forgot-password">
              <button type="button" onClick={handleForgotPassword}>
                Quên mật khẩu?
              </button>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button type="submit" disabled={loading}>
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>

            <small>
              Chưa có tài khoản?{" "}
              <button
                  type="button"
                  className="register-back-button"
                  onClick={onRegister}
              >
                Đăng ký ngay
              </button>
            </small>

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
