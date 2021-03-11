import ChannelsHelper from "../../../core/entities/channels/channelsHelper";
import STATE from "../../../state";

export default class ReservesHelper {

    static async displayBalance() {
        const messageText = await this.balanceText();
        await ChannelsHelper._postToChannelCode('ACTIONS', messageText);
    }

    static async balanceText() {
        let messageText = '';
        const balance = await this.balance();

        if (balance.status === 'success') {
            messageText = `Available Balance (BTC): ${balance.data.available_balance}\n` +
                `Pending Received Balance (BTC): ${balance.data.pending_received_balance}`;
        } else {
            messageText = 'Failure accessing reserves balance.'
        }

        return this.balanceText;
    }

    static balance() {
        return STATE.WALLET.getBalance();
    }

}