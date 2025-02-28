let friends = JSON.parse(localStorage.getItem('friends')) || [];
let items = [];

function openTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(tabName).classList.remove('hidden');

    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="openTab('${tabName}')"]`).classList.add('active');

    if (tabName === 'split') {
        loadFriends();
    } else if (tabName === 'bills') {
        renderPastBills();
    }
}


////Friends tab
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

////Splitting tab
function loadFriends() {
    let selects = document.querySelectorAll(".custom-multiselect");

    selects.forEach(select => {
        let dropdown = select.querySelector(".dropdown-options");
        let selectedSpan = select.querySelector(".selected-options");

        if (!dropdown) {
            console.error("Dropdown not found inside:", select);
            return;
        }

        dropdown.innerHTML = ""; // Clear previous options

        friends.forEach(friend => {
            let option = document.createElement("div");
            option.textContent = friend;
            option.dataset.value = friend;
            option.classList.add("dropdown-item");

            // Ensure clicking doesn’t close dropdown
            option.onclick = function (event) {
                event.stopPropagation(); // Prevent closing
                option.classList.toggle("selected");
                updateSelectedFriends(select);
            };

            dropdown.appendChild(option);
        });

        selectedSpan.textContent = "Split Among All"; // Reset placeholder
    });
}


function toggleDropdown(id, event) {
    if (event) event.stopPropagation(); // Prevent bubbling up

    let dropdown = document.querySelector(`#${id} .dropdown-options`);
    if (!dropdown) {
        console.error("Dropdown not found for ID:", id);
        return;
    }

    // Close other dropdowns before opening the clicked one
    document.querySelectorAll(".dropdown-options").forEach(d => {
        if (d !== dropdown) {
            d.classList.add("hidden");
            d.style.display = "none";
        }
    });

    if (dropdown.classList.contains("hidden")) {
        dropdown.classList.remove("hidden");
        dropdown.style.display = "block";  // Force show

        // Adjust dropdown position if it overflows the screen
        let rect = dropdown.getBoundingClientRect();
        if (rect.bottom > window.innerHeight) {
            dropdown.style.top = "auto";
            dropdown.style.bottom = "100%"; // Move dropdown above if it's too low
        } else {
            dropdown.style.top = "100%"; // Default to below the select
            dropdown.style.bottom = "auto";
        }
    } else {
        dropdown.classList.add("hidden");
        dropdown.style.display = "none";  // Force hide
    }
}



document.addEventListener("click", function(event) {
    document.querySelectorAll(".custom-multiselect .dropdown-options").forEach(dropdown => {
        let parent = dropdown.closest(".custom-multiselect");

        if (!parent.contains(event.target)) {
            dropdown.classList.add("hidden");
            dropdown.style.display = "none";
        } else {
        }
    });
});


function updateSelectedFriends(select) {
    let selectedOptions = select.querySelectorAll(".dropdown-options .selected");
    let selectedValues = Array.from(selectedOptions).map(option => option.dataset.value);

    // Update the UI display text
    let selectedSpan = select.querySelector(".selected-options");
    selectedSpan.textContent = selectedValues.length ? (selectedValues.length > 3 ? selectedValues.length + " Friends" : selectedValues.join(", ")) : "Split Among All";

    // Store the selected values in the element's dataset
    select.dataset.selectedValues = JSON.stringify(selectedValues);
}

function resetSplit() {
    items = [];
    renderItems();
    document.getElementById('finalSplit').innerHTML = "";
}

function renderItems() {
    const list = document.getElementById('itemsList');
    list.innerHTML = "";

    items.forEach((item, index) => {
        let selectText = item.friends.length ? (item.friends.length > 3 ? item.friends.length + " Friends" : item.friends.join(", ")) : "Split Among All";
        list.innerHTML += `
            <div class="item">
                <div class="custom-multiselect inline-friend-select" id="inlineFriendSelect-${index}" onclick="toggleDropdown('inlineFriendSelect-${index}')">
                    <span class="selected-options">${selectText}</span>
                    <div class="dropdown-options hidden">
                        ${friends.map(friend => `
                            <div class="dropdown-item ${item.friends.includes(friend) ? "selected" : ""}" 
                                 data-value="${friend}" 
                                 onclick="toggleInlineFriend(${index}, this)">
                                ${friend}
                            </div>
                        `).join('')}
                    </div>
                </div>
                <input type="text" value="${item.name}" onchange="updateItem(${index}, 'name', this.value)">
                <input type="number" value="${item.price}" onchange="updateItem(${index}, 'price', this.value)">
                <button class="delete-btn" onclick="deleteItem(${index})">🗑</button>
            </div>
        `;
    });
}


function addItem() {
    let select = document.getElementById('friendSelect');
    let selectedFriends = JSON.parse(select.dataset.selectedValues || "[]");

    const name = document.getElementById('itemName').value.trim();
    const price = parseFloat(document.getElementById('itemPrice').value);

    if (name && price) {
        // If no one is selected, store as "split" instead of listing all friends
        if (selectedFriends.length === 0) {
            selectedFriends = ["split"];
        }

        items.push({ friends: selectedFriends, name, price });
        renderItems();
    }
}


function toggleInlineFriend(index, element) {
    event.stopPropagation(); // Prevent click from closing dropdown

    element.classList.toggle("selected");

    let select = document.getElementById(`inlineFriendSelect-${index}`);
    let selectedOptions = select.querySelectorAll(".dropdown-options .selected");
    let selectedValues = Array.from(selectedOptions).map(option => option.dataset.value);

    select.querySelector(".selected-options").textContent = selectedValues.length ? (selectedValues.length > 3 ? selectedValues.length + " Friends" : selectedValues.join(", ")) : "Split Among All";

    // Update the item array
    items[index].friends = selectedValues;
}


function updateItem(index, field, value) {
    if (field === 'friends') {
        items[index].friends = Array.from(value.selectedOptions).map(option => option.value);
    } else if (field === 'price') {
        items[index][field] = parseFloat(value);
    } else {
        items[index][field] = value;
    }
    renderItems();
}


function deleteItem(index) {
    items.splice(index, 1); // Remove the item from the list
    renderItems(); // Refresh the UI
}

function calculateSplit() {
    let splitAmounts = {};
    let activeFriends = new Set();

    // Step 1: Identify friends who have at least one item
    items.forEach(item => {
        if (item.friends.includes("split")) {
            item.friends = []; // Reset to allow dynamic splitting
        }
        item.friends.forEach(friend => activeFriends.add(friend));
    });

    // Step 2: Initialize balances only for active friends
    activeFriends.forEach(friend => splitAmounts[friend] = 0);

    // Step 3: Distribute item costs
    items.forEach(item => {
        let splitBetween = item.friends.length > 0 ? item.friends : Array.from(activeFriends);
        let share = item.price / splitBetween.length;

        splitBetween.forEach(friend => {
            splitAmounts[friend] += share;
        });
    });

    // Step 4: Display results only for active friends
    let resultHTML = Object.entries(splitAmounts)
        .map(([friend, amount]) => `<p>${friend}: ${amount.toFixed(2)} Kč</p>`)
        .join('');

    document.getElementById('finalSplit').innerHTML = resultHTML;
}



function appendToPastBillsLocalStorage(items, splitAmounts) {
    let savedBills = JSON.parse(localStorage.getItem('bills')) || [];

    // Add "paid" status to each item
    items.forEach(item => {
        item.paid = false;
    });

    // Create a structured bill object
    let newBill = {
        items: [...items], // Store individual items for duplication
        totalPerPerson: { ...splitAmounts }, // Store total amounts per person
        paidStatus: {}, // Track who has fully paid
        timestamp: new Date().toISOString()
    };

    // Initialize paidStatus per person
    Object.keys(splitAmounts).forEach(friend => {
        newBill.paidStatus[friend] = false;
    });

    // Push new bill to the start of the array instead of the end
    savedBills.unshift(newBill);

    // Save updated bills list
    localStorage.setItem('bills', JSON.stringify(savedBills));
}




////Past bills tab
function renderPastBills() {
    const billsList = document.getElementById('billsList');
    let savedBills = JSON.parse(localStorage.getItem('bills')) || [];
    billsList.innerHTML = ""; // Clear previous content

    if (savedBills.length === 0) {
        billsList.innerHTML = "<p>No past bills found.</p>";
        return;
    }

    savedBills.forEach((bill, billIndex) => {
        if (!bill.totalPerPerson || typeof bill.totalPerPerson !== 'object') {
            bill.totalPerPerson = {}; // Ensure it exists
        }

        if (!bill.paidStatus || typeof bill.paidStatus !== 'object') {
            bill.paidStatus = {}; // Ensure it exists
        }

        let billHTML = `
            <div class="bill-item">
                <p><strong>${new Date(bill.timestamp).toLocaleString()}</strong></p>
                <ul>
                    ${Object.entries(bill.totalPerPerson).map(([friend, amount]) => {
                        return `
                            <li style="${bill.paidStatus[friend] ? 'text-decoration: line-through; color: gray;' : ''}">
                                ${friend}: ${amount.toFixed(2)} Kč 
                                ${bill.paidStatus[friend] 
                                    ? `<button class="btn unpay-btn" onclick="markPersonUnpaid(${billIndex}, '${friend}')">❌</button>` 
                                    : `<button class="btn pay-btn" onclick="markPersonPaid(${billIndex}, '${friend}')">💸</button>`}
                            </li>
                        `;
                    }).join('')}
                </ul>
                <button class="btn edit-btn" onclick="editBill(${billIndex})">📑 Duplicate</button>
                <button class="btn delete-btn" onclick="deleteBill(${billIndex})">🗑 Delete</button>
            </div>
        `;
        billsList.innerHTML += billHTML;
    });
}

function markPersonPaid(billIndex, friend) {
    let savedBills = JSON.parse(localStorage.getItem('bills')) || [];

    if (savedBills[billIndex] && savedBills[billIndex].paidStatus[friend] !== undefined) {
        savedBills[billIndex].paidStatus[friend] = true; // Mark as paid
        localStorage.setItem('bills', JSON.stringify(savedBills));
        renderPastBills(); // Refresh the UI
    } else {
        console.error(`Invalid bill or friend at ${billIndex}, ${friend}`);
    }
}

function markPersonUnpaid(billIndex, friend) {
    let savedBills = JSON.parse(localStorage.getItem('bills')) || [];

    if (savedBills[billIndex] && savedBills[billIndex].paidStatus[friend] !== undefined) {
        savedBills[billIndex].paidStatus[friend] = false; // Mark as unpaid
        localStorage.setItem('bills', JSON.stringify(savedBills));
        renderPastBills(); // Refresh the UI
    } else {
        console.error(`Invalid bill or friend at ${billIndex}, ${friend}`);
    }
}



function editBill(index) {
    let savedBills = JSON.parse(localStorage.getItem('bills')) || [];
    
    if (savedBills[index] && Array.isArray(savedBills[index].items)) {
        items = [...savedBills[index].items]; // Load the correct items array
        renderItems(); // Refresh the UI with the bill details
        openTab('split'); // Navigate to the "Split" tab
    } else {
        console.error(`Bill at index ${index} is not correctly formatted.`);
    }
}



function deleteBill(index) {
    let savedBills = JSON.parse(localStorage.getItem('bills')) || [];
    savedBills.splice(index, 1); // Remove the bill from the array
    localStorage.setItem('bills', JSON.stringify(savedBills));
    renderPastBills(); // Refresh bills list
}


// Bind Enter key to the Add Friend button
document.getElementById('friendName').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission
        addFriend();
    }
});

// Bind Enter key to the Add Item button
document.getElementById('itemName').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addItem();
    }
});

document.getElementById('itemPrice').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        addItem();
    }
});

function getPreviousItems() {
    let savedBills = JSON.parse(localStorage.getItem('bills')) || [];
    
    // Extract all item names from each bill's `items` array
    let itemNames = new Set(); // Use Set to ensure uniqueness
    savedBills.forEach(bill => {
        if (bill.items && Array.isArray(bill.items)) {
            bill.items.forEach(item => {
                if (item.name) {
                    itemNames.add(item.name.trim());
                }
            });
        }
    });

    return [...itemNames]; // Convert Set back to an array
}

function setupAutocomplete() {
    const itemInput = document.getElementById('itemName');
    let suggestions = document.createElement('div');
    suggestions.setAttribute('id', 'itemSuggestions');
    document.body.appendChild(suggestions); // No inline styles needed

    itemInput.addEventListener('input', function () {
        let inputText = itemInput.value.toLowerCase().trim();
        let previousItems = getPreviousItems();
        
        // Filter items and remove duplicates
        let filteredItems = [...new Set(previousItems.filter(item => item.toLowerCase().includes(inputText)))];

        suggestions.innerHTML = '';
        if (filteredItems.length > 0 && inputText.length > 0) {
            suggestions.style.display = 'block';

            // Adjust positioning dynamically
            let rect = itemInput.getBoundingClientRect();
            suggestions.style.left = `${rect.left}px`;
            suggestions.style.top = `${rect.bottom + window.scrollY}px`;
            suggestions.style.width = `${rect.width}px`;

            filteredItems.forEach(item => {
                let suggestion = document.createElement('div');
                suggestion.textContent = item;
                suggestion.classList.add('autocomplete-item');

                suggestion.addEventListener('click', function () {
                    itemInput.value = item;
                    suggestions.style.display = 'none';
                });

                suggestions.appendChild(suggestion);
            });
        } else {
            suggestions.style.display = 'none';
        }
    });

    // Handle Enter key selection
    itemInput.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && suggestions.style.display === 'block') {
            let firstSuggestion = suggestions.firstChild;
            if (firstSuggestion) {
                itemInput.value = firstSuggestion.textContent;
                suggestions.style.display = 'none';
                event.preventDefault();
            }
        }
    });

    document.addEventListener('click', function (e) {
        if (!suggestions.contains(e.target) && e.target !== itemInput) {
            suggestions.style.display = 'none';
        }
    });
}

//Import
function parseFoodoraOrder() {
    let importTextArea = document.getElementById('import-area');
    if (!importTextArea) {
        console.error("Textarea not found!");
        return;
    }

    let importText = importTextArea.value;
    if (!importText || typeof importText !== 'string') {
        console.error("Invalid or empty input text.");
        return;
    }

    let lines = importText.split("\n").map(line => line.trim()).filter(line => line !== "");
    
    let parsedItems = [];
    let quantityPattern = /^(\d+)x$/; // Matches "1x", "30x", etc.
    let pricePattern = /\d+,\d{2} Kč|\d+ Kč/; // Matches "257,00 Kč" or "128 Kč"

    let currentQuantity = 1; // Default quantity is 1
    let lastItemName = null; // Track last detected item name
    let ignoreKeywords = ["Mezisoučet", "Celkem", "Způsob platby"];
    let invertKeywords = ["Sleva"];


    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Check if the line represents a quantity like "2x"
        let quantityMatch = line.match(quantityPattern);
        if (quantityMatch) {
            currentQuantity = parseInt(quantityMatch[1]); // Store the new quantity
            lastItemName = null;
            continue;
        }

        // If it's a price line, we assume the previous line(s) were the item name
        if (pricePattern.test(line)) {
            let priceMatch = line.match(pricePattern)[0];
            let price = parseFloat(priceMatch.replace(" Kč", "").replace(",", "."));

            // The item name is usually before the price line. If the previous line was also an item description, take the first occurrence.
            let itemName = lastItemName ? lastItemName : lines[i - 1];
            lastItemName = null; // Reset for the next item

            

            if (ignoreKeywords.some(keyword => itemName.includes(keyword))) {
                lastItemName = null;
                continue;
            }

            
            if (invertKeywords.some(keyword => itemName.includes(keyword))) {
                price = -price;
            }

            // Divide the price by quantity and add each item separately
            let individualPrice = price / currentQuantity;
            for (let j = 0; j < currentQuantity; j++) {
                parsedItems.push({ friend: "split", name: itemName, price: individualPrice });
            }

            // Reset quantity after processing the item
            currentQuantity = 1;
        } else {
            // Store last valid item name if it doesn't match a price
            if (!quantityPattern.test(line)) {
                if (lastItemName === null) {
                    lastItemName = line; // Store first part of name if available
                }
            }
        }
    }

    // Update global items list
    items = parsedItems;
    renderItems();

    // Switch to the "Split" tab
    openTab('split');
}





// Call the setup function when the page loads
setupAutocomplete();
renderFriends();