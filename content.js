function button() {
    const tradeButtons = document.querySelector('.trade-buttons');
    if (tradeButtons && !document.querySelector('.blockButton')) {
        const blockButton = document.createElement('button');
        blockButton.textContent = 'Block';
        blockButton.className = 'btn-control-md blockButton';
        Object.assign(blockButton.style, {
            backgroundColor: 'rgb(247, 75, 82)',
            color: 'white',
            borderBottomColor: 'rgb(247, 75, 82)',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
            borderBottomStyle: 'solid',
            borderBottomWidth: '1px',
            borderLeftColor: 'rgb(247, 75, 82)',
            borderLeftStyle: 'solid',
            borderLeftWidth: '1px',
            borderRightColor: 'rgb(247, 75, 82)',
            borderRightStyle: 'solid',
            borderRightWidth: '1px',
            borderTopColor: 'rgb(247, 75, 82)',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            borderTopStyle: 'solid',
            borderTopWidth: '1px',
            cursor: 'pointer',
            display: 'inline-block',
            fontFamily: '"Builder Sans", sans-serif',
            fontSize: '16px',
            fontWeight: '500',
            height: '36px',
            marginBottom: '5px',
            marginLeft: '0px',
            marginRight: '12px',
            marginTop: '0px',
            padding: '9px',
            textAlign: 'center',
            verticalAlign: 'middle',
            width: '71.5156px',
            '-webkit-font-smoothing': 'antialiased',
        });
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

function close() {
    document.querySelector('.modal-backdrop')?.parentNode?.remove();
}

async function block() {
    const { userId, tradeId } = getTradeDetails();
    if (!userId || !tradeId) return alert('User ID or Trade ID not found.');
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
            alert('User blocked successfully.');
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
            alert(`Failed to block user: ${blockErrorData.errors[0].userFacingMessage}`);
        }
    } catch (error) {
        console.error('Error blocking user or declining trade:', error);
        alert('An error occurred while trying to block the user.');
    }
    close();
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
