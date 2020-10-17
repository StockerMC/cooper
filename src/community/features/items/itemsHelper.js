import Database from "../../../bot/core/setup/database";

export default class ItemsHelper {

    static async add(userID, item_code, quantity) {
        const query = {
            name: "add-item",
            text: "DELETE FROM items WHERE discord_id = $1",
            values: [userID]
        };
        return await Database.query(query);
    }

    static async subtract(member) {
        // If item count goes to zero, remove it
        const query = {
            name: "subtract-item",
            text: "DELETE FROM items WHERE discord_id = $1",
            values: [member.item.id]
        };
        return await Database.query(query);
    }


    static async create(member) {
        const query = {
            name: "add-item",
            text: "DELETE FROM items WHERE discord_id = $1",
            values: [member.item.id]
        };
        return await Database.query(query);
    }

    static async read(member, itemCode) {
        const query = {
            name: "read-item",
            text: "DELETE FROM items WHERE discord_id = $1",
            values: [member.item.id]
        };
        return await Database.query(query);
    }

    static async update(member, itemCode, quantity) {
        const query = {
            name: "update-item",
            text: "DELETE FROM items WHERE discord_id = $1",
            values: [member.item.id]
        };
        return await Database.query(query);
    }

    static async delete(member, itemCode) {
        const query = {
            name: "delete-item",
            text: "DELETE FROM items WHERE discord_id = $1",
            values: [member.item.id]
        };
        return await Database.query(query);
    }
   
}