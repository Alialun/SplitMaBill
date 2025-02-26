let friends = JSON.parse(localStorage.getItem('friends')) || [];
let items = [];

function openTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(tabName).classList.remove('hidden');

    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="openTab('${tabName}')"]`).classList.add('active');

    if (tabName === 'split') {
        loadFriends();
    }
}

function renderFriends() {
    const list = document.getElementById('friendsList');
    list.innerHTML = "";
    friends.forEach((friend, index) => {
        list.innerHTML += `
            <div class="friend-item">
                <input type="text" value="${friend}" onchange="updateFriend(${index}, this.value)">
                <button class="delete-btn" onclick="deleteFriend(${index})">🗑</button>
            </div>
        `;
    });
}

function addFriend() {
    const name = document.getElementById('friendName').value.trim();
    if (name) {
        friends.push(name);
        localStorage.setItem('friends', JSON.stringify(friends));
        document.getElementById('friendName').value = "";
        renderFriends();
    }
}

function updateFriend(index, newName) {
    friends[index] = newName;
    localStorage.setItem('friends', JSON.stringify(friends));
}

function deleteFriend(index) {
    friends.splice(index, 1);
    localStorage.setItem('friends', JSON.stringify(friends));
    renderFriends();
}

function loadFriends() {
    let select = document.getElementById('friendSelect');
    select.innerHTML = `<option value="split">Split Among All</option>`;
    friends.forEach(friend => {
        select.innerHTML += `<option value="${friend}">${friend}</option>`;
    });
}

function addItem() {
    const friend = document.getElementById('friendSelect').value;
    const name = document.getElementById('itemName').value.trim();
    const price = parseFloat(document.getElementById('itemPrice').value);

    if (name && price) {
        items.push({ friend, name, price });
        renderItems();
    }
}

function renderItems() {
    const list = document.getElementById('itemsList');
    list.innerHTML = "";
    items.forEach((item, index) => {
        list.innerHTML += `
            <div class="item">
                <select onchange="updateItem(${index}, 'friend', this.value)">
                    <option value="split" ${item.friend === "split" ? "selected" : ""}>Split Among All</option>
                    ${friends.map(friend => `<option value="${friend}" ${item.friend === friend ? "selected" : ""}>${friend}</option>`).join('')}
                </select>
                <input type="text" value="${item.name}" onchange="updateItem(${index}, 'name', this.value)">
                <input type="number" value="${item.price}" onchange="updateItem(${index}, 'price', this.value)">
                <button class="delete-btn" onclick="deleteItem(${index})">🗑</button>
            </div>
        `;
    });
}

function updateItem(index, field, value) {
    items[index][field] = field === 'price' ? parseFloat(value) : value;
    renderItems(); // Refresh to apply changes
}

function deleteItem(index) {
    items.splice(index, 1); // Remove the item from the list
    renderItems(); // Refresh the UI
}

function calculateSplit() {
    let splitAmounts = {};
    
    // Initialize friends who have at least one item in the bill
    let activeFriends = new Set(items.map(item => item.friend).filter(friend => friend !== "split"));

    // Initialize balances for only active friends
    activeFriends.forEach(friend => splitAmounts[friend] = 0);

    // Calculate amounts owed
    items.forEach(item => {
        if (item.friend === "split") {
            let splitCount = activeFriends.size;
            if (splitCount > 0) {
                let splitCost = item.price / splitCount;
                activeFriends.forEach(friend => splitAmounts[friend] += splitCost);
            }
        } else {
            splitAmounts[item.friend] += item.price;
        }
    });

    // Display final amounts owed
    let resultHTML = "";
    for (let [friend, amount] of Object.entries(splitAmounts)) {
        resultHTML += `<p>${friend}: ${amount.toFixed(2)}Kč</p>`;
    }
    document.getElementById('finalSplit').innerHTML = resultHTML;

    // Generate QR Code for Payment
    //document.getElementById('qrcode').innerHTML = "";
    //new QRCode(document.getElementById('qrcode'), JSON.stringify(splitAmounts));
}

renderFriends();
