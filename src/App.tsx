import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import jsPDF from "jspdf";
import "jspdf-autotable";
import {
  User,
  Lock,
  LogOut,
  Clock,
  Calendar,
  DollarSign,
  FileText,
  Briefcase,
  Users,
  CheckCircle,
  Printer,
  Plus,
  FileContract,
} from "lucide-react";

// === IMPORT FILE CSS ===
import "./App.css";

// --- 1. CONFIG SUPABASE ---
const supabaseUrl = "YOUR_SUPABASE_URL"; // Thay URL của bạn
const supabaseKey = "YOUR_SUPABASE_ANON_KEY"; // Thay Key của bạn
const supabase = createClient(supabaseUrl, supabaseKey);

// --- 2. TYPES ---
interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  role: string;
  department: string;
}

interface LeaveRequest {
  id: string;
  user_id: string;
  full_name?: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
}

interface Contract {
  id: string;
  employee_name: string;
  contract_type: string;
  start_date: string;
  end_date: string;
  salary_base: number;
  status: string;
}

// --- 3. MODULES COMPONENT ---

// >> Module 1: Đăng nhập
const LoginScreen = ({ onLogin }: { onLogin: (u: UserProfile) => void }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .single();

    if (error || !data) {
      setError("Sai thông tin đăng nhập! (Thử: nhanvien/123, qlns/123)");
    } else {
      onLogin(data);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>
          <Briefcase size={24} /> HR System Login
        </h2>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Tên đăng nhập</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập username"
            />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập password"
            />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button type="submit" className="btn-login">
            Đăng Nhập
          </button>
        </form>
        <div className="demo-note">
          <strong>Tài khoản Demo:</strong>
          <br />
          nhanvien / 123 (Gửi đơn nghỉ)
          <br />
          truongbp / 123 (Duyệt đơn)
          <br />
          qlns / 123 (Hợp đồng & Báo cáo)
        </div>
      </div>
    </div>
  );
};

// >> Module 2: Xin Nghỉ Phép (Cho Nhân Viên)
const RequestLeaveModule = ({ user }: { user: UserProfile }) => {
  const [form, setForm] = useState({
    type: "Phép năm",
    start: "",
    end: "",
    reason: "",
  });
  const [msg, setMsg] = useState("");

  const handleSubmit = async () => {
    if (!form.start || !form.end) return;
    const { error } = await supabase.from("leave_requests").insert({
      user_id: user.id,
      leave_type: form.type,
      start_date: form.start,
      end_date: form.end,
      reason: form.reason,
      status: "Pending",
    });
    if (!error) {
      setMsg("Đã gửi đơn thành công! Chờ Trưởng bộ phận duyệt.");
      setForm({ ...form, reason: "" });
    } else {
      setMsg("Lỗi khi gửi đơn.");
    }
  };

  return (
    <div className="card">
      <h3>
        <FileText size={20} /> Gửi Đơn Xin Nghỉ
      </h3>
      <div className="form-group">
        <label>Loại phép</label>
        <select
          className="form-input"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option>Phép năm</option>
          <option>Nghỉ ốm</option>
          <option>Việc riêng</option>
        </select>
      </div>
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}
      >
        <div className="form-group">
          <label>Từ ngày</label>
          <input
            type="date"
            className="form-input"
            onChange={(e) => setForm({ ...form, start: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Đến ngày</label>
          <input
            type="date"
            className="form-input"
            onChange={(e) => setForm({ ...form, end: e.target.value })}
          />
        </div>
      </div>
      <div className="form-group">
        <label>Lý do nghỉ</label>
        <textarea
          className="form-input"
          rows={3}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
        ></textarea>
      </div>
      <button
        onClick={handleSubmit}
        className="btn-action btn-success"
        style={{ width: "100%", padding: "10px" }}
      >
        Gửi Đơn
      </button>
      {msg && (
        <p style={{ color: "green", marginTop: "10px", fontWeight: "bold" }}>
          {msg}
        </p>
      )}
    </div>
  );
};

// >> Module 3: Duyệt Nghỉ Phép (Cho Trưởng Bộ Phận)
const ApproveLeaveModule = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("leave_requests")
      .select("*, users(full_name)")
      .eq("status", "Pending");

    if (data) {
      const formatted = data.map((item: any) => ({
        ...item,
        full_name: item.users?.full_name,
      }));
      setRequests(formatted);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (id: string, action: "Approved" | "Rejected") => {
    await supabase
      .from("leave_requests")
      .update({ status: action })
      .eq("id", id);
    fetchRequests();
  };

  return (
    <div className="card">
      <h3>
        <CheckCircle size={20} /> Duyệt Đơn Nghỉ Phép (Pending)
      </h3>
      {requests.length === 0 ? (
        <p style={{ color: "#777" }}>Không có yêu cầu nào mới.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Nhân viên</th>
              <th>Lý do</th>
              <th>Thời gian</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td>
                  <strong>{req.full_name}</strong>
                </td>
                <td>{req.reason}</td>
                <td>
                  {req.start_date} → {req.end_date}
                </td>
                <td>
                  <button
                    onClick={() => handleAction(req.id, "Approved")}
                    className="btn-action btn-success"
                  >
                    Duyệt
                  </button>
                  <button
                    onClick={() => handleAction(req.id, "Rejected")}
                    className="btn-action btn-danger"
                  >
                    Từ chối
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// >> Module 4: Quản Lý Hợp Đồng & Báo Cáo (Cho HR)
const ContractsReportModule = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const { data } = await supabase.from("contracts").select("*");
      if (data) setContracts(data);
    };
    loadData();
  }, []);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("BAO CAO DANH SACH HOP DONG NHAN SU", 14, 20);
    doc.setFontSize(10);
    doc.text(`Ngay xuat: ${new Date().toLocaleDateString()}`, 14, 30);

    const tableData = contracts.map((c) => [
      c.employee_name,
      c.contract_type,
      c.start_date,
      c.end_date,
      c.salary_base.toLocaleString("vi-VN") + " VND",
      c.status,
    ]);

    (doc as any).autoTable({
      startY: 35,
      head: [
        [
          "Nhan Vien",
          "Loai HD",
          "Ngay BD",
          "Ngay KT",
          "Luong CB",
          "Trang Thai",
        ],
      ],
      body: tableData,
    });
    doc.save("Bao_Cao_Hop_Dong.pdf");
  };

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <h3>
          <FileContract size={20} /> Danh Sách Hợp Đồng
        </h3>
        <button
          onClick={exportPDF}
          className="btn-action btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "5px" }}
        >
          <Printer size={16} /> Xuất PDF
        </button>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Nhân viên</th>
            <th>Loại HĐ</th>
            <th>Hiệu lực</th>
            <th>Lương CB</th>
            <th>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {contracts.map((c) => (
            <tr key={c.id}>
              <td>{c.employee_name}</td>
              <td>{c.contract_type}</td>
              <td>
                {c.start_date} - {c.end_date}
              </td>
              <td style={{ textAlign: "right", fontFamily: "monospace" }}>
                {c.salary_base.toLocaleString()}
              </td>
              <td>
                <span
                  className={`badge ${
                    c.status === "Active" ? "badge-active" : "badge-warning"
                  }`}
                >
                  {c.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// --- 4. MAIN APP LAYOUT & ROUTING ---

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [view, setView] = useState("dashboard");

  const getMenu = () => {
    if (!user) return [];
    const role = user.role;
    const menus = [
      { id: "dashboard", label: "Trang chủ", icon: <Briefcase size={18} /> },
    ];

    if (role === "NhanVien") {
      menus.push({
        id: "xinphep",
        label: "Xin Nghỉ Phép",
        icon: <FileText size={18} />,
      });
    }
    if (role === "TruongBoPhan") {
      menus.push({
        id: "duyetnghi",
        label: "Duyệt Nghỉ Phép",
        icon: <CheckCircle size={18} />,
      });
    }
    if (role === "QuanLyNhanSu" || role === "BoPhanTuyenDung") {
      menus.push({
        id: "hopdong",
        label: "Hợp Đồng & Báo Cáo",
        icon: <FileContract size={18} />,
      });
    }
    return menus;
  };

  const renderContent = () => {
    switch (view) {
      case "xinphep":
        return <RequestLeaveModule user={user!} />;
      case "duyetnghi":
        return <ApproveLeaveModule />;
      case "hopdong":
        return <ContractsReportModule />;
      default:
        return (
          <div>
            <div className="card">
              <h3>Xin chào, {user?.full_name}</h3>
              <p>
                Vai trò: <strong>{user?.role}</strong> - Phòng ban:{" "}
                <strong>{user?.department}</strong>
              </p>
            </div>
            <div className="dashboard-grid">
              <div className="stat-card bg-blue">
                <h4>Việc cần làm</h4>
                <div className="number">3</div>
              </div>
              <div className="stat-card bg-green">
                <h4>Công tháng này</h4>
                <div className="number">22</div>
              </div>
              <div className="stat-card bg-purple">
                <h4>Phép còn lại</h4>
                <div className="number">10</div>
              </div>
            </div>
          </div>
        );
    }
  };

  if (!user) return <LoginScreen onLogin={setUser} />;

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Briefcase size={24} /> HR Manager
        </div>
        <nav className="sidebar-menu">
          {getMenu().map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`menu-item ${view === item.id ? "active" : ""}`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div className="user-details">
              <h4>{user.full_name}</h4>
              <span>{user.role}</span>
            </div>
          </div>
          <button onClick={() => setUser(null)} className="btn-logout">
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="top-header">
          <h2 className="page-title">{view}</h2>
          <div style={{ fontSize: "14px", color: "#666" }}>
            <Calendar
              size={14}
              style={{ marginRight: "5px", display: "inline" }}
            />
            {new Date().toLocaleDateString("vi-VN")}
          </div>
        </header>
        <div className="content-body">{renderContent()}</div>
      </main>
    </div>
  );
}
