let currentUser = null;
let piInstance = null;

async function initPi() {
  try {
    piInstance = await Pi.init({
      version: "2.0",
      sandbox: true   // ← Testnet
    });
  } catch (e) { console.error(e); }
}

async function loginWithPi() {
  try {
    const user = await Pi.authenticate(['username', 'payments'], onIncompletePaymentFound);
    currentUser = user;
    document.getElementById('loginPage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadGallery();
    loadTransactions();
  } catch (err) {
    alert("Login failed. Use Pi Browser.");
  }
}

async function onIncompletePaymentFound(payment) {
  // Handle incomplete payments if needed
  console.log("Incomplete payment:", payment);
}

async function sendSalary() {
  const recipient = document.getElementById('recipient').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);

  if (!recipient || !amount) return alert("Fill all fields");

  try {
    const paymentData = {
      amount: amount,
      memo: "Salary / Gold Payment - Ayubaikr",
      metadata: { type: "salary", app: "Ayubaikr" }
    };

    const callbacks = {
      onReadyForServerApproval: (paymentId) => {
        fetch('http://localhost:3000/api/payment/approve', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ paymentId })
        });
      },
      onReadyForServerCompletion: (paymentId, txid) => {
        fetch('http://localhost:3000/api/payment/complete', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ paymentId, txid, amount })
        }).then(() => loadTransactions());
      },
      onCancel: () => alert("Payment cancelled"),
      onError: (err) => alert("Error: " + err)
    };

    await Pi.createPayment(paymentData, callbacks);
    alert("Payment flow started!");
  } catch (err) {
    console.error(err);
    alert("Payment failed");
  }
}

function loadGallery() {
  const gallery = document.getElementById('gallery');
  const images = ['gold1.jpg', 'salary.jpg', 'team.jpg']; // Add real images to /gallery/
  gallery.innerHTML = images.map(src => 
    `<img src="gallery/${src}" alt="Gallery">`
  ).join('');
}

async function loadTransactions() {
  const res = await fetch('http://localhost:3000/api/transactions');
  const txs = await res.json();
  const list = document.getElementById('txList');
  list.innerHTML = txs.map(tx => 
    `<li>${new Date(tx.time).toLocaleString()} - ${tx.amount} Gold → Tx: ${tx.txid?.slice(0,10)}...</li>`
  ).join('');
}

function logout() {
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('loginPage').style.display = 'block';
}

window.onload = initPi;