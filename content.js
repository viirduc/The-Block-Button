function button() {
    const tradeButtons = document.querySelector('.trade-buttons');
    if (tradeButtons && !document.querySelector('.blockButton')) {
        const blockButton = document.createElement('button');
        blockButton.textContent = 'Block';
        blockButton.className = 'btn-control-md blockButton';

        Object.assign(blockButton.style, {
            backgroundColor: '#F44336',
            color: 'white',
            borderColor: '#F44336',
            borderradius: '4px',
            cursor: 'pointer',
        });

        // hover
        blockButton.onmouseenter = () => {
            blockButton.style.backgroundColor = '#D32F2F';
            blockButton.style.borderColor = '#D32F2F';
        };
        blockButton.onmouseleave = () => {
            blockButton.style.backgroundColor = '#F44336';
            blockButton.style.borderColor = '#F44336';
        };

        blockButton.onclick = blockConfirmation;

        tradeButtons.appendChild(blockButton);
    }
}

function blockConfirmation() {
    const modalHtml = `
        <div role="dialog">
            <div class="modal-backdrop in"></div>
            <div role="dialog" tabindex="-1" class="in modal" style="display: block;">
                <div class="modal-window modal-sm modal-dialog">
                    <div class="modal-content" role="document">
                        <div class="modal-header">
                            <button type="button" class="close" title="close"><span class="icon-close"></span></button>
                            <h4 class="modal-title">Warning</h4>
                        </div>
                        <div class="modal-body">Are you sure you want to block this user?</div>
                        <div class="modal-footer">
                            <div class="loading"></div>
                            <div class="modal-buttons">
                                <button type="button" class="modal-button btn-primary-md btn-min-width" id="confirmBlockButton">Block</button>
                                <button type="button" class="modal-button btn-control-md btn-min-width" id="cancelBlockButton">Cancel</button>
                            </div>
                            <div class="text-footer">After blocking this user, they will no longer be able to send trades to you.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);

    document.getElementById('confirmBlockButton').onclick = block;
    document.getElementById('cancelBlockButton').onclick = close;
    modalContainer.querySelector('.close').onclick = close;
}

function showRobloxAlert(title, message, isSuccess = true) {
    const modalHtml = `
        <div role="dialog">
            <div class="modal-backdrop in"></div>
            <div role="dialog" tabindex="-1" class="in modal" style="display: block;">
                <div class="modal-window modal-sm modal-dialog">
                    <div class="modal-content" role="document">
                        <div class="modal-header">
                            <button type="button" class="close" title="close"><span class="icon-close"></span></button>
                            <h4 class="modal-title">${title}</h4>
                        </div>
                        <div class="modal-body">${message}</div>
                        <div class="modal-footer">
                            <div class="modal-buttons">
                                <button type="button" class="modal-button btn-primary-md btn-min-width" id="confirmAlertButton">OK</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer);

    const confirmButton = document.getElementById('confirmAlertButton');
    confirmButton.onclick = () => {
        modalContainer.remove();
    };

    modalContainer.querySelector('.close').onclick = () => {
        modalContainer.remove();
    };
}

function close() {
    document.querySelector('.modal-backdrop')?.parentNode?.remove();
}

async function block() {
    const { userId, tradeId } = getTradeDetails();
    if (!userId || !tradeId) {
        showRobloxAlert('Error', 'User ID or Trade ID not found.', false);
        return;
    }

    try {
        const [csrf, cookie] = await Promise.all([get('csrf'), get('cookie')]);
        const blockResponse = await fetch(`https://apis.roblox.com/user-blocking-api/v1/users/${userId}/block-user`, {
            method: 'POST',
            headers: {
                'x-csrf-token': csrf,
                'x-bound-auth-token': cookie,
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (blockResponse.ok) {
            showRobloxAlert('Success', 'User blocked successfully.', true);

            await fetch(`https://trades.roblox.com/v1/trades/${tradeId}/decline`, {
                method: 'POST',
                headers: {
                    'x-csrf-token': csrf,
                    'x-bound-auth-token': cookie,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
        } else {
            const blockErrorData = await blockResponse.json();
            showRobloxAlert('Error', `Failed to block user: ${blockErrorData.errors[0].userFacingMessage}`, false);
        }
    } catch (error) {
        console.error('Error blocking user or declining trade:', error);
        showRobloxAlert('Error', 'An error occurred while trying to block the user.', false);
    } finally {
        close();
    }
}

function getTradeDetails() {
    const profileLink = document.querySelector('.trade-row.selected .avatar-card-link')?.getAttribute('href');
    const userId = profileLink ? profileLink.match(/users\/(\d+)\/profile/)?.[1] || null : null;
    const tradeRow = document.querySelector('.trade-row.selected');
    const tradeId = tradeRow ? tradeRow.getAttribute('tradeid') || null : null;
    return { userId, tradeId };
}

function get(key) {
    return new Promise((resolve) => {
        chrome.storage.local.get(key, result => resolve(result[key] || null));
    });
}

document.addEventListener('DOMContentLoaded', button);
new MutationObserver(button).observe(document.body, { childList: true, subtree: true });
