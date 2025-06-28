document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENT REFERENCES ---
    const expenseForm = document.getElementById('expense-form');
    const categorySelect = document.getElementById('category');
    const amountInput = document.getElementById('amount');
    const currencySelect = document.getElementById('currency');
    const descriptionInput = document.getElementById('description');
    const expenseList = document.getElementById('expense-list');
    const totalAmountSpan = document.getElementById('total-amount');
    const displayCurrencySpan = document.getElementById('display-currency');
    const baseCurrencySelect = document.getElementById('base-currency');
    const clearAllBtn = document.getElementById('clear-all');
    const exportBtn = document.getElementById('export-data');
    const chartCanvas = document.getElementById('expense-chart').getContext('2d');

    // --- STATE MANAGEMENT ---
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    let expenseChart;

    // NOTE: In a real-world app, fetch these from an API. For this demo, they are hardcoded.
    const exchangeRates = {
        USD: 1,
        EUR: 0.92,
        JPY: 157.34,
        KRW: 1378.50,
        INR: 83.47,
        CNY: 7.24,
        GBP: 0.79,
        CAD: 1.37,
        AUD: 1.50
    };

    // --- FUNCTIONS ---

    // Save expenses to local storage and re-render UI
    const saveAndRender = () => {
        localStorage.setItem('expenses', JSON.stringify(expenses));
        updateUI();
    };

    // Convert any amount to the base currency
    const convertCurrency = (amount, fromCurrency, toCurrency) => {
        const amountInUSD = amount / exchangeRates[fromCurrency];
        return amountInUSD * exchangeRates[toCurrency];
    };

    // Render the list of expenses
    const renderExpenseList = () => {
        expenseList.innerHTML = '';
        if (expenses.length === 0) {
            expenseList.innerHTML = '<p style="text-align:center; color:#777;">No expenses recorded yet.</p>';
            return;
        }

        const reversedExpenses = [...expenses].reverse(); // Show newest first
        reversedExpenses.forEach(expense => {
            const item = document.createElement('div');
            item.className = 'expense-item';
            item.innerHTML = `
                <div class="expense-details">
                    <div class="expense-category">${expense.category}</div>
                    <div class="expense-description">${expense.description || 'No description'}</div>
                </div>
                <div class="expense-amount">
                    ${expense.amount.toFixed(2)} ${expense.currency}
                </div>
                <div class="expense-actions">
                    <button class="delete-btn" data-id="${expense.id}">🗑️</button>
                </div>
            `;
            expenseList.appendChild(item);
        });
    };

    // Calculate totals and render the pie chart
    const renderChart = () => {
        const baseCurrency = baseCurrencySelect.value;
        const aggregatedData = {};
        let total = 0;

        expenses.forEach(expense => {
            const convertedAmount = convertCurrency(expense.amount, expense.currency, baseCurrency);
            const categoryName = expense.category; 
            
            if (aggregatedData[categoryName]) {
                aggregatedData[categoryName] += convertedAmount;
            } else {
                aggregatedData[categoryName] = convertedAmount;
            }
            total += convertedAmount;
        });

        // Update total amount display
        totalAmountSpan.textContent = total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        displayCurrencySpan.textContent = baseCurrency;

        // Update chart
        const chartLabels = Object.keys(aggregatedData);
        const chartData = Object.values(aggregatedData);
        
        if (expenseChart) {
            expenseChart.destroy();
        }
        
        expenseChart = new Chart(chartCanvas, {
            type: 'pie',
            data: {
                labels: chartLabels,
                datasets: [{
                    data: chartData,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', 
                        '#FF9F40', '#C9CBCF', '#E7E9ED', '#8D9FAF'
                    ],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed !== null) {
                                    label += new Intl.NumberFormat('en-US', {
                                        style: 'currency',
                                        currency: baseCurrency
                                    }).format(context.parsed);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    };

    // Central function to update all parts of the UI
    const updateUI = () => {
        renderExpenseList();
        renderChart();
    };

    // --- EVENT HANDLERS ---
    
    // Add a new expense
    expenseForm.addEventListener('submit', e => {
        e.preventDefault();
        const newExpense = {
            id: Date.now(),
            category: categorySelect.value,
            amount: parseFloat(amountInput.value),
            currency: currencySelect.value,
            description: descriptionInput.value.trim()
        };
        expenses.push(newExpense);
        saveAndRender();
        expenseForm.reset();
        categorySelect.focus(); // Focus on the first field for quick entry
    });

    // Delete an expense
    expenseList.addEventListener('click', e => {
        if (e.target.classList.contains('delete-btn')) {
            const id = parseInt(e.target.getAttribute('data-id'));
            expenses = expenses.filter(exp => exp.id !== id);
            saveAndRender();
        }
    });

    // Change base currency for chart
    baseCurrencySelect.addEventListener('change', updateUI);

    // Clear all expenses
    clearAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete ALL expenses? This action cannot be undone.')) {
            expenses = [];
            saveAndRender();
        }
    });

    // Export data to CSV
    exportBtn.addEventListener('click', () => {
        if (expenses.length === 0) {
            alert('No data to export.');
            return;
        }
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID,Category,Amount,Currency,Description\n"; // Header row
        
        expenses.forEach(exp => {
            const row = [exp.id, `"${exp.category}"`, exp.amount, exp.currency, `"${exp.description}"`].join(",");
            csvContent += row + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "budget_expenses.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // --- INITIAL RENDER ---
    updateUI();
});
