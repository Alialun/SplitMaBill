let friends = JSON.parse(localStorage.getItem('friends')) || [];
let items = [];
let anyQR = false;

let toastErrorCol = "#aa0000";
let toastOkCol = "#28a745";

function openTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(tabName).classList.remove('hidden');

    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[onclick="openTab('${tabName}')"]`).classList.add('active');

    // **Fix: Only reload friends when a friend is added/removed**
    if (tabName === 'split') {
        loadFriends();
        renderItems();
    } else if (tabName === 'bills') {
        renderPastBills();
    }
}


//resourcing
i18next
  .use(i18nextBrowserLanguageDetector) // Detect user language
  .use(i18nextXHRBackend) // Load translations via XHR
  .init({
    backend: {
      loadPath: './locales/{{lng}}.json', // Path to the translation files
    },
    fallbackLng: 'en', // Fallback language when user language isn't available
    interpolation: {
      escapeValue: false, // No need to escape HTML
    },
  }, function(err, t) {
    // Apply translations after i18next initialization
    applyTranslations();

    // Set languageSwitcher select to detected language
    const languageSwitcher = document.getElementById('languageSwitcher');
    languageSwitcher.value = i18next.language;

    // Listen for language switcher changes
    languageSwitcher.addEventListener('change', (event) => {
      const selectedLang = event.target.value;
      i18next.changeLanguage(selectedLang, function() {
        applyTranslations(); // Reapply translations when language changes
      });
    });
  });

    // Function to apply translations to elements with data-i18n
    function applyTranslations() {
      const elements = document.querySelectorAll('[data-res]');
      elements.forEach((el) => {
        const key = el.getAttribute('data-res');
        
        if (key.includes('placeholder')) {
            el.placeholder = i18next.t(key);
          } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.value = i18next.t(key);
          } else {
            el.innerHTML = i18next.t(key);
          }
          
      });
    }



////Friends tab
function renderFriends() {
    const list = document.getElementById('friendsList');
    list.innerHTML = "";
    friends.forEach((friend, index) => {
        list.innerHTML += `
            <div class="friend-item">
                <input class="friend-input" type="text" value="${friend}" onchange="updateFriend(${index}, this.value)">
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
    showToast(i18next.t("friend-deleted"), toastOkCol);
    renderFriends();
}

////Splitting tab
function loadFriends() {
    let selects = document.querySelectorAll(".custom-multiselect");

    selects.forEach((select, index) => {
        let dropdown = select.querySelector(".dropdown-options");
        let selectedSpan = select.querySelector(".selected-options");

        if (!dropdown) {
            showToast(`Dropdown not found inside: ${select}`, toastErrorCol);
            return;
        }

        let selectedFriends = [];
        let hasSelection = false;

        // **Get selected friends from the `items` array if it exists**
        if(index != 0) {
            index -=1;
            selectedFriends = items[index] ? items[index].friends : [];
            hasSelection = selectedFriends.length > 0;
        }

        dropdown.innerHTML = ""; // Clear previous options

        friends.forEach(friend => {
            let option = document.createElement("div");
            option.textContent = friend;
            option.dataset.value = friend;
            option.classList.add("dropdown-item");

            // Mark as selected if in the item's friends list
            if (selectedFriends.includes(friend)) {
                option.classList.add("selected");
            }

            // Toggle selection on click
            option.onclick = function (event) {
                event.stopPropagation();
                option.classList.toggle("selected");
                updateSelectedFriends(select, index);
            };

            dropdown.appendChild(option);
        });

        // **Fix: Read selection from `items` instead of resetting**
        selectedSpan.textContent = hasSelection
            ? (selectedFriends.length > 3 ? selectedFriends.length + " Friends" : selectedFriends.join(", "))
            : i18next.t("split-among-all");
    });
}



function toggleDropdown(id, event) {
    if (event) event.stopPropagation(); // Prevent event bubbling

    let dropdown = document.querySelector(`#${id} .dropdown-options`);
    let parentItem = document.querySelector(`#${id}`).closest(".item"); // Get the item's container

    if (!dropdown) {
        showToast(`Dropdown not found for ID: ${id}`, toastErrorCol);
        return;
    }

    // Close other dropdowns and reset z-index of all items
    document.querySelectorAll(".dropdown-options").forEach(d => {
        if (d !== dropdown) {
            d.classList.add("hidden");
            d.style.display = "none";
            let item = d.closest(".item");
            if (item) item.style.zIndex = "1"; // Reset other items
        }
    });

    if (dropdown.classList.contains("hidden")) {
        dropdown.classList.remove("hidden");
        dropdown.style.display = "block";  // Show dropdown

        // Increase z-index of the item's container to bring it to the front
        if (parentItem) {
            parentItem.style.zIndex = "1000";
        }

        // Ensure dropdown is above other elements
        dropdown.style.zIndex = "1100";

        // Check if there is enough space below
        let rect = dropdown.getBoundingClientRect();
        let availableSpaceBelow = window.innerHeight - rect.bottom;
        let availableSpaceAbove = rect.top;

        if (availableSpaceBelow < 100 && availableSpaceAbove > availableSpaceBelow) {
            dropdown.style.top = "auto";
            dropdown.style.bottom = "100%"; // Move dropdown above
        } else {
            dropdown.style.top = "100%";
            dropdown.style.bottom = "auto"; // Default position
        }
    } else {
        dropdown.classList.add("hidden");
        dropdown.style.display = "none";

        // Reset z-index when dropdown is closed
        if (parentItem) {
            parentItem.style.zIndex = "1";
        }
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
    selectedSpan.textContent = selectedValues.length ? (selectedValues.length > 3 ? selectedValues.length + " Friends" : selectedValues.join(", ")) : i18next.t("split-among-all");

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
        let selectText = item.friends.length ? (item.friends.length > 3 ? item.friends.length + " Friends" : item.friends.join(", ")) : i18next.t("split-among-all");
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
                <input type="text" class="item-input" value="${item.name}" onchange="updateItem(${index}, 'name', this.value)">
                <input type="number" class="item-input" value="${item.price}" onchange="updateItem(${index}, 'price', this.value)">
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
            selectedFriends = [i18next.t("split-among-all")];
        }

        items.push({ friends: selectedFriends, name, price });
        renderItems();
    }
    else
    {
        showToast(i18next.t("missing-name-or-price"), toastErrorCol);
    }
}


function toggleInlineFriend(index, element) {
    event.stopPropagation(); // Prevent click from closing dropdown

    element.classList.toggle("selected");

    let select = document.getElementById(`inlineFriendSelect-${index}`);
    let selectedOptions = select.querySelectorAll(".dropdown-options .selected");
    let selectedValues = Array.from(selectedOptions).map(option => option.dataset.value);

    select.querySelector(".selected-options").textContent = selectedValues.length ? (selectedValues.length > 3 ? selectedValues.length + " Friends" : selectedValues.join(", ")) : i18next.t("split-among-all");

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
    showToast(i18next.t("item-deleted"), toastOkCol);
    renderItems(); // Refresh the UI
}

function calculateSplit() {
    let splitAmounts = {};
    let splitItems = {};
    let activeFriends = [];
    console.log(items);

    // Step 1: Identify friends who have at least one item
    items.forEach(item => {
        if (item.friends.includes(i18next.t("split-among-all"))) {
            item.friends = []; // Reset to allow dynamic splitting
        }
        item.friends.forEach(friend =>{ if(!activeFriends.includes(friend)) activeFriends.push(friend) });
    });
    

    // Step 2: Initialize balances only for active friends
    activeFriends.forEach(friend => splitAmounts[friend] = 0);

    // Step 3: Distribute item costs
    items.forEach(item => {
        let splitBetween = item.friends.length > 0 ? item.friends : Array.from(activeFriends);
        let share = item.price / splitBetween.length;

        let edittedItem = { name: item.name, price: share};
        edittedItem.price = share;

        splitBetween.forEach(friend => {
            splitAmounts[friend] += share;
            if (!splitItems[friend]) {
                splitItems[friend] = [];
            }
            splitItems[friend].push(edittedItem);
        });
    });

    console.log(splitItems);
    console.log(splitAmounts);

    for (let friend in splitAmounts) {
        splitAmounts[friend] = Math.round(splitAmounts[friend]);
    }

    drawSplitCanvas(splitAmounts, splitItems);

    appendToPastBillsLocalStorage(items, splitAmounts);

    // Step 4: Display results only for active friends
    /*let resultHTML = Object.entries(splitAmounts)
        .map(([friend, amount]) => `<p>${friend}: ${amount.toFixed(0)} Kč</p>`)
        .join('');

    document.getElementById('finalSplit').innerHTML = resultHTML;*/
}

async function drawSplitCanvas(splitAmounts, splitItems) {
    //let canvas = document.getElementById("splitCanvas");
    canvas = document.createElement("canvas");
    let ctx = canvas.getContext("2d");

    let baseHeight = 150;  // Start with some height for title
    let nameLineHeight = 40;  // Space per line
    let itemLineHeight = 32;  // Space per line
    let spacingHeight = 20;  // Space per line
    let requiredHeight = baseHeight;

    // Calculate needed height
    for (let person in splitItems) {
        requiredHeight += nameLineHeight; // Person's name
        requiredHeight += splitItems[person].length * itemLineHeight; // Number of items they have
        requiredHeight += spacingHeight; // Extra space after each person
    }
    if(anyQR)
    {
        requiredHeight += 460 + nameLineHeight;
    }

    canvas.width = 1000; // Set width
    canvas.height = requiredHeight; // Set new height

    // Draw background
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    //Draw background gradient
    // Define the gradient at an angle (45°)
    let gradient = ctx.createLinearGradient(canvas.width/2-100, canvas.height, canvas.width/2+100, 0);

    // Add color stops to create a mirrored effect
    //gradient.addColorStop(0, "#202020"); // Middle transition to blue
    gradient.addColorStop(0, "#333333"); // Middle transition to blue
    gradient.addColorStop(0.5, "#1a1a1a");   // Start with red
    gradient.addColorStop(0.7, "#1a1a1a");   // Start with red
    gradient.addColorStop(1, "#232323"); // Middle transition to blue
    //gradient.addColorStop(0.9, "#1a1a1a");   // End back to red

    // Apply gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 2; // Set thickness of the outline
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)"; // White color with 50% transparency
    ctx.strokeRect(5, 5, canvas.width-10, canvas.height-10); // (x, y, width, height)

    // Set text styles
    ctx.font = "32px Arial";
    ctx.fillStyle = "white"; 

    let x = 40;
    let y = 80;

    // Draw title
    ctx.font = "24px Arial";
    ctx.textAlign = "right";
    ctx.fillText("Generated by alialun.github.io/SplitMaBill", canvas.width-20, canvas.height-20);
    ctx.textAlign = "left";
    ctx.font = "40px Arial";
    ctx.fillText("Souhrn - "+new Date().toLocaleDateString(), x, y);
    y += 60;

    // Reset font for details

    // Draw each person's items
    for (let person in splitItems) {
        ctx.font = "bold 32px Arial";
        ctx.fillText(person + " - " + splitAmounts[person].toFixed(0) + " Kč", x, y);
        y += nameLineHeight;
        ctx.font = "24px Arial";

        splitItems[person].forEach(item => {
            ctx.fillText("- " + item.name.slice(0,55) + ": " + item.price.toFixed(2)+" Kč", x + 20, y);
            y += itemLineHeight;
        });

        y += spacingHeight; // Extra space between people
    }

    // Draw qr codes
    if(anyQR)
    {
        let canvasRevolut = document.getElementById("canvasRevolut");
        let ctxRevolut = canvasRevolut.getContext("2d");
        let canvasOther = document.getElementById("canvasOther");
        let ctxOther = canvasOther.getContext("2d");

        ctx.font = "bold 32px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Revolut", x+200, y+20);
        ctx.fillText("Banka", x+720, y+20);
        ctx.textAlign = "left";
        y += nameLineHeight;
        ctx.drawImage(canvasRevolut, x, y, 400, 400);
        ctx.drawImage(canvasOther, x+520, y, 400, 400);
    }


    //watermark 
    let watermarkImg = await loadImage("https://alialun.github.io/SplitMaBill/watermark.png");
    ctx.globalAlpha = 0.3; // Set transparency
    ctx.drawImage(watermarkImg, canvas.width - watermarkImg.width - 15, 10);
    ctx.globalAlpha = 1.0; // Reset transparency

    let imgElement = document.getElementById("splitImg");

    // Convert canvas to image URL
    let dataURL = canvas.toDataURL("image/png");

    // Set as image source
    imgElement.src = dataURL;
    imgElement.style.display = "block"; // Show image
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
    
    showToast(i18next.t("saved-to-history"), toastOkCol);
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
                                ${friend}: ${amount.toFixed(0)} Kč 
                                ${bill.paidStatus[friend] 
                                    ? `<button class="btn unpay-btn" onclick="markPersonUnpaid(${billIndex}, '${friend}')">❌</button>` 
                                    : `<button class="btn pay-btn" onclick="markPersonPaid(${billIndex}, '${friend}')">💸</button>`}
                            </li>
                        `;
                    }).join('')}
                </ul>
                <button class="btn edit-btn" data-res="bill-duplicate-btn" onclick="editBill(${billIndex})">`+i18next.t("bill-duplicate-btn")+`</button>
                <button class="btn delete-btn" data-res="bill-delete-btn" onclick="deleteBill(${billIndex})">`+i18next.t("bill-delete-btn")+`</button>
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
        showToast(`Invalid bill or friend at ${billIndex}, ${friend}`, toastErrorCol);
    }
}

function markPersonUnpaid(billIndex, friend) {
    let savedBills = JSON.parse(localStorage.getItem('bills')) || [];

    if (savedBills[billIndex] && savedBills[billIndex].paidStatus[friend] !== undefined) {
        savedBills[billIndex].paidStatus[friend] = false; // Mark as unpaid
        localStorage.setItem('bills', JSON.stringify(savedBills));
        renderPastBills(); // Refresh the UI
    } else {
        showToast(`Invalid bill or friend at ${billIndex}, ${friend}`, toastErrorCol);
    }
}



function editBill(index) {
    let savedBills = JSON.parse(localStorage.getItem('bills')) || [];
    
    if (savedBills[index] && Array.isArray(savedBills[index].items)) {
        items = [...savedBills[index].items]; // Load the correct items array
        renderItems(); // Refresh the UI with the bill details
        openTab('split'); // Navigate to the "Split" tab
    } else {
        showToast(`Bill at index ${index} is not correctly formatted.`, toastErrorCol);
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
        showToast("Text area not found!", toastErrorCol);
        return;
    }

    let importText = importTextArea.value;
    if (!importText || typeof importText !== 'string') {
        showToast(i18next.t("empty-text-area-error"), toastErrorCol);
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
                parsedItems.push({ friends: [], name: itemName, price: individualPrice });
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
    setTimeout(() => {
        console.log("This message appears after 1 second");
    }, 1000);
    
    // Switch to the "Split" tab
    openTab('split');
    setTimeout(() => {
        console.log("This message appears after 1 second");
    }, 1000);
    renderItems();
}


function parseFoodoraOrderMarek() {
    let importTextArea = document.getElementById('import-area');
    if (!importTextArea) {
        showToast("Text area not found!", toastErrorCol);
        return;
    }

    let importText = importTextArea.value;
    if (!importText || typeof importText !== 'string') {
        showToast(i18next.t("empty-text-area-error"), toastErrorCol);
        return;
    }

    let lines = importText.split("\n").map(line => line.trim()).filter(line => line !== "");
    
    let parsedItems = [];
    let quantityPattern = /^(\d+)x\s*/; // Matches "2x " or "3x "
    let pricePattern = /(\d+,\d{2}|\d+) Kč/; // Matches "318,00 Kč" or "42 Kč"
    let ignoreKeywords = ["Mezisoučet", "Celkem", "Způsob platby"];
    let invertKeywords = ["Sleva"];
    
    let currentQuantity = 1;
    let lastItemName = null;

    console.log(lines);
    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];


        let quantityMatch = line.match(quantityPattern);
        if (quantityMatch) {
            currentQuantity = parseInt(quantityMatch[1]);
            line = line.replace(quantityPattern, "").trim(); // Remove the quantity prefix
        }

        if (pricePattern.test(line)) {
            let priceMatch = line.match(pricePattern)[1];
            let price = parseFloat(priceMatch.replace(",", "."));
            
            let itemName = lastItemName ? lastItemName : lines[i - 1];
            lastItemName = null;

            
            if (ignoreKeywords.some(keyword => itemName.includes(keyword))) {
                lastItemName = null;
                continue;
            }

            if (invertKeywords.some(keyword => itemName.includes(keyword))) {
                price = -price;
            }

            let individualPrice = price / currentQuantity;
            for (let j = 0; j < currentQuantity; j++) {
                parsedItems.push({ friends: [], name: itemName, price: individualPrice });
            }
            
            currentQuantity = 1;
        } else {
            if (!pricePattern.test(line)) {
                lastItemName = line;
            }
        }
    }
    
    console.log(parsedItems);
    // Update global items list
    items = parsedItems;
    setTimeout(() => {
        console.log("This message appears after 1 second");
    }, 1000);
    
    // Switch to the "Split" tab
    openTab('split');
    setTimeout(() => {
        console.log("This message appears after 1 second");
    }, 1000);
    renderItems();
}

function parseReplayOrder() {
    let importTextArea = document.getElementById('import-area');
    if (!importTextArea) {
        showToast("Text area not found!", toastErrorCol);
        return;
    }

    let importText = importTextArea.value;
    if (!importText || typeof importText !== 'string') {
        showToast(i18next.t("empty-text-area-error"), toastErrorCol);
        return;
    }

    const lines = importText.split("\n").map(l => l.trim()).filter(l => l !== "");

    const parsedItems = [];
    const header = "Množství Za kus Celkem";
    const tipKeyword = "Spropitné:";

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        if (line === tipKeyword && lines[i + 1]) {
            let tipAmount = parseFloat(lines[i + 1].replace("Kč", "").trim());
            parsedItems.push({ friends: [], name: "Spropitné", price: tipAmount });
            i++; // Skip next line (already processed)
            continue;
        }

        if (lines[i + 1] === header && lines[i + 2]) {
            // Remove trailing price (e.g. "10Kč") from name
            let itemName = line.replace(/\d+Kč$/, "").trim();

            // Parse the third line for quantity and total price
            const quantityPriceMatch = lines[i + 2].match(/^(\d+)x\s+\d+Kč\s+(\d+)Kč$/);
            if (quantityPriceMatch) {
                const quantity = parseInt(quantityPriceMatch[1]);
                const totalPrice = parseFloat(quantityPriceMatch[2]);
                const individualPrice = totalPrice / quantity;

                for (let j = 0; j < quantity; j++) {
                    parsedItems.push({ friends: [], name: itemName, price: individualPrice });
                }
                i += 2; // Skip header and quantity line (already processed)
            }
        }
    }

    console.log(parsedItems);
    items = parsedItems;

    setTimeout(() => {
        console.log("Items rendered after 1 second");
    }, 1000);

    openTab('split');

    setTimeout(() => {
        renderItems();
    }, 1000);
}

//GPT parser
function getGPTPromptOrder() {
    // let importTextArea = document.getElementById('import-area');
    // if (!importTextArea) {
    //     showToast("Text area not found!", toastErrorCol);
    //     return;
    // }

    // let importText = importTextArea.value;
    // if (!importText || typeof importText !== 'string') {
    //     importText = "";
    //     //showToast(i18next.t("empty-text-area-error"), toastErrorCol);
    // }

    let prompt = 
`This is a bill for my order. I want you to parse it and give it to me in a very specific format.
1) Extract individual items (their Name, Price, Amount)
2) Ignore any items that are sums (Celkem, Total, Bez DPH, Mezisoučet, etc.)
3) DO NOT ignore service fees, delivery, tip, include those, make items out of these
4) for items that have greater amount than 1, divide the total price and duplicate them X times, where X is their amount.
5) Return me a block of code (ONLY block of code, no text before or after) in this specific format. Groups of 2 rows per item
\`\`\`
Item name
Item price
Item name
Item price
Item name
Item price
etc.
\`\`\`
DO NOT ADD ANYTHING ELSE. DO NOT INCLUDE CURRENCY, make the prices just plain numbers. For lines that are like sleva or some kind of price reduction, make the price negative.
Never make packaging costs as extra rows, include it in the item prices (you can check if they already are part of the price by checking the total price of the bill).

The bill:
`;
    
    navigator.clipboard.writeText(prompt);
    showToast(i18next.t("copied-to-clipboard"), toastOkCol);
    importTextArea.value = '';

}


function parseGPTOrder() {
    let importTextArea = document.getElementById('import-area');
    if (!importTextArea) {
        showToast("Text area not found!", toastErrorCol);
        return;
    }

    let importText = importTextArea.value;
    if (!importText || typeof importText !== 'string') {
        showToast(i18next.t("empty-text-area-error"), toastErrorCol);
        return;
    }

    let lines = importText.split("\n").map(line => line.trim()).filter(line => line !== "");
    
    let parsedItems = [];
    let itemName = "";
    
    console.log(lines);
    for (let i = 0; i < lines.length; i++) {
        if(i%2 == 1)
        {
            parsedItems.push({ friends: [], name: itemName, price: lines[i] })
        }
        else
        {
            itemName = lines[i];
        }
    }
    
    console.log(parsedItems);
    // Update global items list
    items = parsedItems;
    setTimeout(() => {
        console.log("This message appears after 1 second");
    }, 1000);
    
    // Switch to the "Split" tab
    openTab('split');
    setTimeout(() => {
        console.log("This message appears after 1 second");
    }, 1000);
    renderItems();
}


function saveCanvasToLocalStorage(canvasId) {
    let canvas = document.getElementById(canvasId);
    let dataURL = canvas.toDataURL("image/png"); // Convert to Base64 PNG
    localStorage.setItem(canvasId, dataURL); // Store in localStorage
}

function loadCanvasFromLocalStorage(canvasId) {
    let canvas = document.getElementById(canvasId);
    let ctx = canvas.getContext("2d");
    let dataURL = localStorage.getItem(canvasId);

    if (dataURL) {
        let img = new Image();
        img.src = dataURL;
        img.onload = function () {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
        };
        anyQR = true;
    }
}

function loadCanvases() {
    loadCanvasFromLocalStorage("canvasRevolut");
    loadCanvasFromLocalStorage("canvasOther");
}


async function processImage(id) {
    let fileInput = document.getElementById("imageInput" + id);
    let file = fileInput.files[0];

    if (!file) return; // If no file, do nothing

    let img = new Image();
    let reader = new FileReader();

    // Wrap image loading inside a Promise
    let imageLoaded = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
    });

    reader.onload = function(e) {
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);

    // Wait for the image to load before processing
    await imageLoaded;

    let canvas = document.getElementById("canvas" + id);
    let ctx = canvas.getContext("2d");

    let { width, height } = img;
    let scale = 400 / Math.min(width, height); // Scale so the larger dimension is 200px
    let newWidth = Math.round(width * scale);
    let newHeight = Math.round(height * scale);

    // Ensure tempCanvas is properly created and sized
    let tempCanvas = document.createElement("canvas");
    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;
    let tempCtx = tempCanvas.getContext("2d");

    // Draw resized image
    tempCtx.drawImage(img, 0, 0, newWidth, newHeight);

    // Crop the center to make a 400x400 square
    let startX = Math.max(0, (newWidth - 400) / 2);
    let startY = Math.max(0, (newHeight - 400) / 2);

    // Draw cropped image onto the main canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(tempCanvas, startX, startY, 400, 400, 0, 0, 400, 400);

    ctx.lineWidth = 2; // Set thickness of the outline
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)"; // White color with 50% transparency
    ctx.strokeRect(1, 1, canvas.width-4, canvas.height-4); // (x, y, width, height)

    saveCanvasToLocalStorage("canvas" + id);
    anyQR = true;
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.crossOrigin = "anonymous"; // Allows cross-origin image loading
        img.src = src;
        img.onload = () => resolve(img);
        img.onerror = reject;
    });
}

function showToast(message, color = '#444', duration = 5000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');

    toast.className = 'toast';
    toast.style.backgroundColor = color;
    toast.textContent = message;

    // Click to dismiss
    toast.addEventListener('click', () => {
        toast.remove();
    });

    // Auto remove after `duration`
    setTimeout(() => {
        toast.remove();
    }, duration);

    container.appendChild(toast);
}


// Call the setup function when the page loads
setupAutocomplete();
renderFriends();
loadCanvases();