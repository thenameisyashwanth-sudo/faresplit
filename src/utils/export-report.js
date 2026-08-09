/**
 * Export utilities for FareSplit - CSV & Printable PDF Reports
 */

export function exportTripToCSV(trip = {}, expenses = [], members = []) {
  const tripTitle = trip.title || trip.name || 'Trip'
  let csvContent = 'data:text/csv;charset=utf-8,'

  // Header Section
  csvContent += `FareSplit Trip Report - ${tripTitle}\n`
  csvContent += `Created Date,${new Date().toLocaleDateString()}\n`
  csvContent += `Total Members,${members.length}\n`
  csvContent += `Total Expenses Logged,${expenses.length}\n\n`

  // Expenses Table Header
  csvContent += 'Date,Expense Title,Category,Paid By,Amount (INR),Split Method,Involved Members\n'

  expenses.forEach((e) => {
    const date = e.date || new Date().toISOString().split('T')[0]
    const title = `"${(e.title || 'Expense').replace(/"/g, '""')}"`
    const category = e.category || 'General'
    const paidBy = `"${(e.paidByName || e.paidBy || 'Member').replace(/"/g, '""')}"`
    const amount = e.amount || 0
    const splitType = e.splitType || 'Equal'
    const involved = `"${(e.involvedMembers?.join(', ') || 'All').replace(/"/g, '""')}"`

    csvContent += `${date},${title},${category},${paidBy},${amount},${splitType},${involved}\n`
  })

  // Download Trigger
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `${tripTitle.replace(/\s+/g, '_')}_FareSplit_Summary.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function exportTripToPDF(trip = {}, expenses = [], settlements = [], totalSpent = 0) {
  const tripTitle = trip.title || trip.name || 'Trip Workspace'
  const printWindow = window.open('', '_blank', 'width=900,height=800')

  if (!printWindow) {
    alert('Please allow popups to generate the printable PDF report.')
    return
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>FareSplit Trip Summary - ${tripTitle}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 40px;
            color: #1e293b;
            background: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-b: 2px solid #6366f1;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .brand {
            font-size: 24px;
            font-weight: 900;
            color: #4f46e5;
            letter-spacing: -0.5px;
          }
          .sub {
            font-size: 12px;
            color: #64748b;
            font-weight: 600;
          }
          .summary-cards {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 30px;
          }
          .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            padding: 16px;
            border-radius: 12px;
          }
          .card-title {
            font-size: 11px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: 800;
          }
          .card-val {
            font-size: 22px;
            font-weight: 900;
            color: #0f172a;
            margin-top: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            margin-bottom: 30px;
          }
          th {
            background: #f1f5f9;
            text-align: left;
            padding: 10px 12px;
            font-size: 12px;
            font-weight: 800;
            color: #475569;
            border-bottom: 1px solid #cbd5e1;
          }
          td {
            padding: 10px 12px;
            font-size: 12px;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
          }
          .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 800;
            background: #e0e7ff;
            color: #4338ca;
            text-transform: uppercase;
          }
          .settlement-item {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 12px 16px;
            border-radius: 10px;
            margin-bottom: 8px;
            font-size: 13px;
            font-weight: 700;
            color: #166534;
            display: flex;
            justify-content: space-between;
          }
          .footer {
            margin-top: 50px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            border-t: 1px solid #e2e8f0;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">✨ FareSplit</div>
            <div class="sub">Financial Summary & Settlement Certificate</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 800; font-size: 16px;">${tripTitle}</div>
            <div class="sub">Generated on ${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <div class="summary-cards">
          <div class="card">
            <div class="card-title">Total Expenditure</div>
            <div class="card-val">₹${totalSpent.toLocaleString('en-IN')}</div>
          </div>
          <div class="card">
            <div class="card-title">Total Expenses Logged</div>
            <div class="card-val">${expenses.length}</div>
          </div>
          <div class="card">
            <div class="card-title">Smart Transactions Needed</div>
            <div class="card-val">${settlements.length}</div>
          </div>
        </div>

        <h3 style="font-weight: 900; font-size: 15px; margin-bottom: 10px;">Itemized Expense Log</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th>Category</th>
              <th>Paid By</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${expenses
              .map(
                (e) => `
              <tr>
                <td>${e.date || new Date().toISOString().split('T')[0]}</td>
                <td><strong>${e.title || 'Expense'}</strong></td>
                <td><span class="badge">${e.category || 'General'}</span></td>
                <td>${e.paidByName || e.paidBy || 'Member'}</td>
                <td><strong>₹${(e.amount || 0).toLocaleString('en-IN')}</strong></td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        ${
          settlements.length > 0
            ? `
          <h3 style="font-weight: 900; font-size: 15px; margin-bottom: 10px;">Greedy Debt Settlement Matrix</h3>
          <div>
            ${settlements
              .map(
                (s) => `
              <div class="settlement-item">
                <span><strong>${s.from}</strong> owes <strong>${s.to}</strong></span>
                <span>₹${s.amount.toLocaleString('en-IN')}</span>
              </div>
            `
              )
              .join('')}
          </div>
        `
            : ''
        }

        <div class="footer">
          Generated automatically by FareSplit Smart Settlement Engine • Powered by AI & Minimum Debt Optimization
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `

  printWindow.document.write(htmlContent)
  printWindow.document.close()
}
