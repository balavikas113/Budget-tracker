class BudgetTracker {
    constructor() {
        this.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        this.chart = null;
        this.exchangeRates = {};
        this.baseCurrency = 'USD';
        
        this.initializeEventListeners();
        this.loadExchangeRates();
        this.updateDisplay();
    }

    initializeEventListeners() {
        // Form submission
        document.getElementById('expense-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        // Base currency change
        document.getElementById('base-currency').addEventListener('change', (e) => {
            this.baseCurrency = e.