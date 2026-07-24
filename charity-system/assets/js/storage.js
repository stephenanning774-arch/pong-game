// Local Storage Manager
const STORAGE_KEYS = {
    users: 'charity_users',
    campaigns: 'charity_campaigns',
    donations: 'charity_donations',
    currentUser: 'charity_current_user',
    admin: 'charity_admin',
    messages: 'charity_messages',
    newsletter: 'charity_newsletter',
    theme: 'charity_theme'
};

// Initialize default data
function initializeStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.users)) {
        const defaultUsers = [
            {
                id: 1,
                name: 'Test User',
                username: 'testuser',
                email: 'test@example.com',
                phone: '1234567890',
                password: 'Test@123',
                avatar: 'https://via.placeholder.com/150?text=User',
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(defaultUsers));
    }

    if (!localStorage.getItem(STORAGE_KEYS.admin)) {
        const defaultAdmin = {
            id: 1,
            username: 'admin',
            password: 'Admin@123',
            email: 'admin@charity.com'
        };
        localStorage.setItem(STORAGE_KEYS.admin, JSON.stringify(defaultAdmin));
    }

    if (!localStorage.getItem(STORAGE_KEYS.campaigns)) {
        const defaultCampaigns = [
            {
                id: 1,
                name: 'Clean Water for Everyone',
                description: 'Provide clean drinking water to remote villages',
                category: 'Water',
                goal: 50000,
                raised: 32500,
                image: 'https://via.placeholder.com/400x250?text=Clean+Water',
                status: 'active',
                createdAt: new Date().toISOString(),
                endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString()
            },
            {
                id: 2,
                name: 'Education for Children',
                description: 'Build schools and provide educational materials',
                category: 'Education',
                goal: 75000,
                raised: 55000,
                image: 'https://via.placeholder.com/400x250?text=Education',
                status: 'active',
                createdAt: new Date().toISOString(),
                endDate: new Date(Date.now() + 45*24*60*60*1000).toISOString()
            },
            {
                id: 3,
                name: 'Medical Aid Relief',
                description: 'Provide medical assistance to underprivileged communities',
                category: 'Healthcare',
                goal: 100000,
                raised: 75000,
                image: 'https://via.placeholder.com/400x250?text=Medical+Aid',
                status: 'active',
                createdAt: new Date().toISOString(),
                endDate: new Date(Date.now() + 60*24*60*60*1000).toISOString()
            },
            {
                id: 4,
                name: 'Emergency Food Distribution',
                description: 'Help feed families affected by natural disasters',
                category: 'Food Security',
                goal: 40000,
                raised: 38000,
                image: 'https://via.placeholder.com/400x250?text=Food+Aid',
                status: 'active',
                createdAt: new Date().toISOString(),
                endDate: new Date(Date.now() + 15*24*60*60*1000).toISOString()
            },
            {
                id: 5,
                name: 'Environmental Conservation',
                description: 'Plant trees and restore natural habitats',
                category: 'Environment',
                goal: 60000,
                raised: 42000,
                image: 'https://via.placeholder.com/400x250?text=Environment',
                status: 'active',
                createdAt: new Date().toISOString(),
                endDate: new Date(Date.now() + 50*24*60*60*1000).toISOString()
            },
            {
                id: 6,
                name: 'Orphanage Support',
                description: 'Support and care for orphaned children',
                category: 'Child Welfare',
                goal: 55000,
                raised: 48000,
                image: 'https://via.placeholder.com/400x250?text=Orphanage',
                status: 'active',
                createdAt: new Date().toISOString(),
                endDate: new Date(Date.now() + 35*24*60*60*1000).toISOString()
            }
        ];
        localStorage.setItem(STORAGE_KEYS.campaigns, JSON.stringify(defaultCampaigns));
    }

    if (!localStorage.getItem(STORAGE_KEYS.donations)) {
        localStorage.setItem(STORAGE_KEYS.donations, JSON.stringify([]));
    }

    if (!localStorage.getItem(STORAGE_KEYS.messages)) {
        localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify([]));
    }

    if (!localStorage.getItem(STORAGE_KEYS.newsletter)) {
        localStorage.setItem(STORAGE_KEYS.newsletter, JSON.stringify([]));
    }
}

// User Functions
function getUsers() {
    initializeStorage();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.users)) || [];
}

function addUser(user) {
    const users = getUsers();
    user.id = Math.max(...users.map(u => u.id), 0) + 1;
    user.createdAt = new Date().toISOString();
    users.push(user);
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
    return user;
}

function updateUser(id, updates) {
    const users = getUsers();
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
        users[index] = { ...users[index], ...updates };
        localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
        return users[index];
    }
    return null;
}

function deleteUser(id) {
    const users = getUsers();
    const filtered = users.filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(filtered));
    return true;
}

function getUserByEmail(email) {
    return getUsers().find(u => u.email === email);
}

function getUserByUsername(username) {
    return getUsers().find(u => u.username === username);
}

// Campaign Functions
function getCampaigns() {
    initializeStorage();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.campaigns)) || [];
}

function addCampaign(campaign) {
    const campaigns = getCampaigns();
    campaign.id = Math.max(...campaigns.map(c => c.id), 0) + 1;
    campaign.raised = 0;
    campaign.createdAt = new Date().toISOString();
    campaigns.push(campaign);
    localStorage.setItem(STORAGE_KEYS.campaigns, JSON.stringify(campaigns));
    return campaign;
}

function updateCampaign(id, updates) {
    const campaigns = getCampaigns();
    const index = campaigns.findIndex(c => c.id === id);
    if (index !== -1) {
        campaigns[index] = { ...campaigns[index], ...updates };
        localStorage.setItem(STORAGE_KEYS.campaigns, JSON.stringify(campaigns));
        return campaigns[index];
    }
    return null;
}

function deleteCampaign(id) {
    const campaigns = getCampaigns();
    const filtered = campaigns.filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.campaigns, JSON.stringify(filtered));
    return true;
}

function getCampaignById(id) {
    return getCampaigns().find(c => c.id === parseInt(id));
}

// Donation Functions
function getDonations() {
    initializeStorage();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.donations)) || [];
}

function addDonation(donation) {
    const donations = getDonations();
    donation.id = Math.max(...donations.map(d => d.id), 0) + 1;
    donation.date = new Date().toISOString();
    
    // Update campaign raised amount
    const campaign = getCampaignById(donation.campaignId);
    if (campaign) {
        updateCampaign(campaign.id, {
            raised: campaign.raised + donation.amount
        });
    }
    
    donations.push(donation);
    localStorage.setItem(STORAGE_KEYS.donations, JSON.stringify(donations));
    return donation;
}

function getUserDonations(userId) {
    return getDonations().filter(d => d.userId === userId);
}

function getCampaignDonations(campaignId) {
    return getDonations().filter(d => d.campaignId === campaignId);
}

// Message Functions
function getMessages() {
    initializeStorage();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.messages)) || [];
}

function addMessage(message) {
    const messages = getMessages();
    message.id = Math.max(...messages.map(m => m.id), 0) + 1;
    message.date = new Date().toISOString();
    message.read = false;
    messages.push(message);
    localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
    return message;
}

function markMessageAsRead(id) {
    const messages = getMessages();
    const index = messages.findIndex(m => m.id === id);
    if (index !== -1) {
        messages[index].read = true;
        localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
    }
}

function deleteMessage(id) {
    const messages = getMessages();
    const filtered = messages.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(filtered));
}

// Newsletter Functions
function addNewsletterSubscriber(email) {
    const subscribers = JSON.parse(localStorage.getItem(STORAGE_KEYS.newsletter)) || [];
    if (!subscribers.includes(email)) {
        subscribers.push(email);
        localStorage.setItem(STORAGE_KEYS.newsletter, JSON.stringify(subscribers));
        return true;
    }
    return false;
}

function getNewsletterSubscribers() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.newsletter)) || [];
}

// Session Functions
function setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
}

function getCurrentUser() {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
}

function clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.currentUser);
}

function isLoggedIn() {
    return getCurrentUser() !== null;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', initializeStorage);