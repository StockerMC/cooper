import TradeHelper from '../../community/features/economy/tradeHelper';
import ItemsHelper from '../../community/features/items/itemsHelper';
import CoopCommand from '../../core/entities/coopCommand';

export default class FindTradeCommand extends CoopCommand {

	constructor(client) {
		super(client, {
			name: 'findtrade',
			group: 'economy',
			memberName: 'findtrade',
			aliases: ['findtr'],
			description: 'This command lets you find the trades you want',
			details: `Details of the find command`,
			examples: ['find', '!find laxative'],
			args: [
				{
					key: 'offerItemCode',
					prompt: 'Which item_code are you offering?',
					type: 'string'
				},
				{
					key: 'receiveItemCode',
					prompt: 'Which item_code are you offering?',
					type: 'string',
					default: ''
				}
			],
		});
	}

	async run(msg, { offerItemCode, receiveItemCode }) {
		super.run(msg);

		offerItemCode = ItemsHelper.parseFromStr(offerItemCode);

		// If receive item code has been given, make sure only those matching returned.
		if (receiveItemCode !== '') {
			receiveItemCode = ItemsHelper.parseFromStr(receiveItemCode);

			// If both items given, list only those matching.
			const matches = await TradeHelper.listMatch(offerItemCode, receiveItemCode);

		} else {
			// If only offer item given, list all of that type.
			const types = await TradeHelper.listType(offerItemCode);
		}

    }
    
};