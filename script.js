function resetAppState() {
  localStorage.clear();
  AppState.init();
}



// Global State Management using localStorage
const AppState = {
  get: (key) => JSON.parse(localStorage.getItem(key)) || null,
  set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
  init: () => {
    if (!AppState.get('user')) {
      AppState.set('attendance', [
        { id: 1, subject: 'Software Engineering', present: 18, total: 20 },
        { id: 2, subject: 'Data Structures', present: 15, total: 22 },
        { id: 3, subject: 'Computer Networks', present: 20, total: 25 },
        { id: 4, subject: 'Operating Systems', present: 12, total: 18 }
      ]);
      AppState.set('leaves', [
        { id: 1, date: '2026-05-10', reason: 'Medical Checkup', status: 'Approved' },
        { id: 2, date: '2026-05-15', reason: 'Family Function', status: 'Pending' }
      ]);
      AppState.set('messages', [
        { id: 1, text: 'Hello! How can I help you with your SE assignment?', type: 'received', senderRole: 'Faculty' }
      ]);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AppState.init();
  const path = window.location.pathname;

  const user = AppState.get('user');
  if (!user && !path.endsWith('index.html') && !path.endsWith('/')) {
      window.location.href = 'index.html';
      return;
  }

  // Common UI Setup
  if (user) {
    const usernameDisplays = document.querySelectorAll('.username-display');
    usernameDisplays.forEach(el => el.textContent = user.name + (user.role === 'Faculty' ? ' (Faculty)' : ''));
    
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
      // Very basic highlight active link hack using includes
      if(window.location.href.includes(link.getAttribute('href'))) {
        link.classList.add('active');
      }
    });

    // Security Check: Kick students out of faculty pages
    if (user.role === 'Student' && path.includes('faculty_')) {
        window.location.href = 'dashboard.html';
    }
    // Security Check: Kick faculty out of student dashboard 
    // (though not strictly necessary for prototype, it helps context)
    if (user.role === 'Faculty' && !path.includes('faculty_') && !path.includes('index.html')) {
        window.location.href = 'faculty_dashboard.html';
    }
  }

  // Routing
  if (path.endsWith('index.html') || path.endsWith('/')) initLogin();
  
  // Faculty Pages MUST be checked before Student pages because 'faculty_dashboard.html'.endsWith('dashboard.html') is True!
  else if (path.endsWith('faculty_dashboard.html')) initFacultyDashboard();
  else if (path.endsWith('faculty_attendance.html')) initAttendance(true);
  else if (path.endsWith('faculty_leave.html')) initFacultyLeave();
  else if (path.endsWith('faculty_chat.html')) initChat('Faculty');

  // Student Pages
  else if (path.endsWith('dashboard.html')) initDashboard();
  else if (path.endsWith('attendance.html')) initAttendance(false);
  else if (path.endsWith('leave.html')) initLeave();
  else if (path.endsWith('chat.html')) initChat('Student');
  else if (path.endsWith('report.html')) initReport();
});

function calculateTotalAttendance() {
  const data = AppState.get('attendance');
  let totalP = 0, totalT = 0;
  data.forEach(d => { totalP += d.present; totalT += d.total; });
  return totalT === 0 ? 0 : ((totalP / totalT) * 100).toFixed(1);
}

// ==============================
// Login
// ==============================
function initLogin() {
  const loginBtn = document.getElementById('loginBtn');
  if(loginBtn) {
    loginBtn.addEventListener('click', () => {
      const u = document.getElementById('username').value;
      const p = document.getElementById('password').value;
      const r = document.getElementById('role').value; // Student or Faculty
      if (u && p) {
        AppState.set('user', { name: u, role: r });
        if (r === 'Faculty') window.location.href = 'faculty_dashboard.html';
        else window.location.href = 'dashboard.html';
      } else {
        alert('Please enter both username and password!');
      }
    });
  }
}

// ==============================
// Dashboards
// ==============================
function initDashboard() {
  document.getElementById('dash-attendance').textContent = calculateTotalAttendance() + '%';
  document.getElementById('dash-leaves').textContent = AppState.get('leaves').filter(l => l.status === 'Pending').length;
  document.getElementById('dash-messages').textContent = AppState.get('messages').length;
}

function initFacultyDashboard() {
  const pendingLeaves = AppState.get('leaves').filter(l => l.status === 'Pending');
  document.getElementById('fac-dash-leaves').textContent = pendingLeaves.length;
  document.getElementById('fac-dash-messages').textContent = AppState.get('messages').length;

  const notifList = document.getElementById('fac-notifications-list');
  if (notifList) {
    notifList.innerHTML = '';
    const msgs = AppState.get('messages').filter(m => m.senderRole === 'Student');
    
    let allNotifs = [];
    msgs.forEach(m => allNotifs.push({ type: 'doubt', text: m.text, name: m.senderName || 'Student', time: m.id }));
    pendingLeaves.forEach(l => allNotifs.push({ type: 'leave', text: l.reason, name: l.studentName || 'Student', time: l.id }));
    
    allNotifs.sort((a,b) => b.time - a.time);

    if (allNotifs.length === 0) {
      notifList.innerHTML = '<li style="color: var(--text-muted);">No new notifications.</li>';
    } else {
      allNotifs.slice(0, 10).forEach(n => {
        const li = document.createElement('li');
        li.style.cssText = "padding: 12px; background: rgba(99, 102, 241, 0.1); border-left: 4px solid var(--primary-color); border-radius: 4px;";
        if (n.type === 'doubt') {
            li.innerHTML = `<strong>Doubt from <span style="color:var(--secondary-color)">${n.name}</span>:</strong> "${n.text}" <div style="margin-top: 5px;"><a href="faculty_chat.html" style="color: var(--primary-color); text-decoration: none; font-size: 14px;">Reply</a></div>`;
        } else {
            li.innerHTML = `<strong>Leave from <span style="color:var(--secondary-color)">${n.name}</span>:</strong> "${n.text}" <div style="margin-top: 5px;"><a href="faculty_leave.html" style="color: var(--warning); text-decoration: none; font-size: 14px;">Review Leave</a></div>`;
        }
        notifList.appendChild(li);
      });
    }
  }
}

// ==============================
// Attendance (Shared Logic)
// ==============================
function initAttendance(isEditable) {
  const bodyId = isEditable ? 'fac-attendance-body' : 'attendance-body';
  const attBody = document.getElementById(bodyId);
  if (!attBody) return;

  const renderTable = () => {
    attBody.innerHTML = '';
    const currentData = AppState.get('attendance');
    currentData.forEach((row, index) => {
      const percentage = ((row.present / row.total) * 100).toFixed(1);
      const tr = document.createElement('tr');
      
      let presentCell, totalCell;
      if (isEditable) {
        presentCell = `<input type="number" min="0" max="${row.total}" value="${row.present}" style="width:70px; padding:6px;" onchange="updateAttendance(${index}, 'present', this.value)">`;
        totalCell = `<input type="number" min="1" value="${row.total}" style="width:70px; padding:6px;" onchange="updateAttendance(${index}, 'total', this.value)">`;
      } else {
        presentCell = `<strong>${row.present}</strong>`;
        totalCell = `<strong>${row.total}</strong>`;
      }

      tr.innerHTML = `
        <td>${row.subject}</td>
        <td>${presentCell}</td>
        <td>${totalCell}</td>
        <td>
            <span class="status-badge ${percentage >= 75 ? 'status-approved' : 'status-danger'}">
                ${percentage}%
            </span>
        </td>
      `;
      attBody.appendChild(tr);
    });

    const overallAttEl = document.getElementById('overall-att');
    if (overallAttEl) overallAttEl.textContent = calculateTotalAttendance() + '%';
  };
  
  window.updateAttendance = (index, field, value) => {
    if (!isEditable) return;
    let arr = AppState.get('attendance');
    arr[index][field] = parseInt(value) || 0;
    if (arr[index].present > arr[index].total) arr[index].present = arr[index].total;
    AppState.set('attendance', arr);
    renderTable();
  };

  window.addSubject = () => {
    const subName = document.getElementById('newSub').value;
    if (subName) {
      let arr = AppState.get('attendance');
      arr.push({ id: Date.now(), subject: subName, present: 0, total: 0 });
      AppState.set('attendance', arr);
      document.getElementById('newSub').value = '';
      renderTable();
    }
  };

  renderTable();
}

// ==============================
// Leaves
// ==============================
function initLeave() {
  const btn = document.getElementById('applyBtn');
  const listBody = document.getElementById('leave-body');
  
  const renderLeaves = () => {
    listBody.innerHTML = '';
    const leaves = AppState.get('leaves');
    leaves.forEach(l => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${l.date}</td>
        <td>${l.reason}</td>
        <td><span class="status-badge status-${l.status.toLowerCase()}">${l.status}</span></td>
      `;
      listBody.appendChild(tr);
    });
  };

  if(btn) {
    btn.addEventListener('click', () => {
      const date = document.getElementById('date').value;
      const reason = document.getElementById('reason').value;
      if (date && reason) {
        const leaves = AppState.get('leaves');
        leaves.push({ id: Date.now(), studentName: AppState.get('user').name, date, reason, status: 'Pending' });
        AppState.set('leaves', leaves);
        document.getElementById('date').value = '';
        document.getElementById('reason').value = '';
        renderLeaves();
      } else {
        alert("Enter both date and reason.");
      }
    });
  }
  renderLeaves();
}

function initFacultyLeave() {
    const listBody = document.getElementById('fac-leave-body');
    const renderLeaves = () => {
      listBody.innerHTML = '';
      const leaves = AppState.get('leaves');
      leaves.forEach(l => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${l.studentName || 'Student'}</strong></td>
          <td>${l.date}</td>
          <td>${l.reason}</td>
          <td><span class="status-badge status-${l.status.toLowerCase()}">${l.status}</span></td>
          <td>
            ${l.status === 'Pending' ? `
              <button onclick="approveLeave(${l.id}, 'Approved')" style="background:var(--success); color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-right:5px;">Approve</button>
              <button onclick="approveLeave(${l.id}, 'Rejected')" style="background:var(--danger); color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Reject</button>
            ` : '<em>Reviewed</em>'}
          </td>
        `;
        listBody.appendChild(tr);
      });
    };
  
    window.approveLeave = (id, newStatus) => {
        let leaves = AppState.get('leaves');
        let l = leaves.find(x => x.id === id);
        if (l) l.status = newStatus;
        AppState.set('leaves', leaves);
        renderLeaves();
    };

    renderLeaves();
}

// ==============================
// Chat (Shared Logic)
// ==============================
function initChat(roleContext) {
  // Determine IDs based on role
  const boxId = roleContext === 'Faculty' ? 'fac-chatBox' : 'chatBox';
  const inputId = roleContext === 'Faculty' ? 'fac-msg' : 'msg';
  const btnId = roleContext === 'Faculty' ? 'fac-sendBtn' : 'sendBtn';

  const box = document.getElementById(boxId);
  const input = document.getElementById(inputId);
  const btn = document.getElementById(btnId);
  
  if (!box || !input || !btn) return;

  const renderMessages = () => {
    box.innerHTML = '';
    const msgs = AppState.get('messages');
    msgs.forEach(m => {
      const div = document.createElement('div');
      
      // If Im Student and sender is Student -> It's 'sent'
      // If Im Student and sender is Faculty -> It's 'received'
      // If Im Faculty and sender is Faculty -> It's 'sent'
      let visualType = 'received';
      if (m.senderRole === roleContext) {
          visualType = 'sent';
      }

      div.className = `message ${visualType}`;
      div.innerHTML = `<strong>${m.senderRole}</strong><br>${m.text}`;
      box.appendChild(div);
    });
    box.scrollTop = box.scrollHeight;
  };

  btn.addEventListener('click', () => {
    const text = input.value.trim();
    if(text) {
      const msgs = AppState.get('messages');
      msgs.push({ id: Date.now(), text, type: 'sent', senderRole: roleContext, senderName: AppState.get('user').name });
      AppState.set('messages', msgs);
      input.value = '';
      renderMessages();
    }
  });
  
  input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') btn.click();
  });
  
  renderMessages();
}

// ==============================
// Reports
// ==============================
function initReport() {
    const genBtn = document.getElementById('genBtn');
    const rptDiv = document.getElementById('reportData');
    
    genBtn.addEventListener('click', () => {
        const user = AppState.get('user');
        const att = calculateTotalAttendance();
        const leaves = AppState.get('leaves').length;
        
        rptDiv.innerHTML = `
            <div style="margin-top:20px; line-height:1.6;">
                <p><strong>Student Name:</strong> ${user.name}</p>
                <p><strong>Overall Attendance:</strong> ${att}%</p>
                <p><strong>Total Leaves Requested:</strong> ${leaves}</p>
                <p><strong>Status:</strong> ${att >= 75 ? '<span style="color:var(--success)">Eligible for Exams</span>' : '<span style="color:var(--danger)">Attendance Shortage</span>'}</p>
                <p><em>Report generated on: ${new Date().toLocaleDateString()}</em></p>
            </div>
        `;
    });
}

window.logout = () => {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
};