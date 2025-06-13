// Tab System - Core functionality
function showTab(tabName) {
    console.log('showTab called with:', tabName);
    
    try {
        // Hide all tabs
        const allTabs = document.querySelectorAll('.tab-content');
        const allButtons = document.querySelectorAll('.tab-button');
        
        allTabs.forEach(tab => tab.classList.remove('active'));
        allButtons.forEach(btn => btn.classList.remove('active'));

        // Show selected tab
        const contentEl = document.getElementById('content-' + tabName);
        const buttonEl = document.getElementById('tab-' + tabName);
        
        if (contentEl) {
            contentEl.classList.add('active');
            console.log('Showed content:', contentEl.id);
        } else {
            console.error('Content element not found:', 'content-' + tabName);
        }
        
        if (buttonEl) {
            buttonEl.classList.add('active');
            console.log('Activated button:', buttonEl.id);
        } else {
            console.error('Button element not found:', 'tab-' + tabName);
        }
        
        // Load tab data after a small delay
        setTimeout(() => {
            loadTabData(tabName);
        }, 100);
        
        console.log('Tab switched successfully to:', tabName);
        
    } catch (error) {
        console.error('Error in showTab:', error);
    }
}

// Load data for specific tab
function loadTabData(tabName) {
    try {
        switch(tabName) {
            case 'records':
                if (typeof loadRecords === 'function') {
                    loadRecords();
                }
                break;
            case 'merchants':
                if (typeof loadMerchantsDebts === 'function') {
                    loadMerchantsDebts();
                }
                break;
            case 'withdrawals':
                if (typeof loadWithdrawals === 'function') {
                    loadWithdrawals();
                }
                break;
            case 'naber':
                if (typeof loadNaberAccount === 'function') {
                    loadNaberAccount();
                }
                break;
            case 'partners':
                if (typeof loadPartnersData === 'function') {
                    loadPartnersData();
                }
                break;
            default:
                console.log('No data loader for tab:', tabName);
        }
    } catch (error) {
        console.error('Error loading tab data:', error);
    }
}

// Make functions globally available
window.showTab = showTab;
window.loadTabData = loadTabData;