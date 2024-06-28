import asyncio
import sqlite3
from telethon.sync import TelegramClient, events
from rich.console import Console
import re
import time
import requests

# Your API credentials
api_id = 'API_ID'
api_hash = 'API_HASH'
phone_number = 'PHONE_NUMBER'

# Source chat ID and destination chat username
source_chat_id = 'SOURCE_ID'
destination_chat_username = 'NAME'  # replace with the actual username or ID

# Sniper bot's buy endpoint URL
sniper_bot_buy_url = 'http://localhost:3000/buy'

# Initialize the console for formatted output
console = Console()

class MessageForwarder:
    def __init__(self):
        self.contract_addresses = {}

    def extract_top10_percentage(self, message_text):
        # Regular expression to find the percentage after **TOP 10** :
        pattern = re.compile(r'\*\*HOLDERS\*\* » \*\*TOP 10\*\* : `(\d+\.\d+)%`')
        match = pattern.search(message_text)
        if match:
            return float(match.group(1))
        return None

    def get_contract_address_from_message(self, message):
        # Regular expression to match contract address format between 30-50 alphanumeric characters
        contract_address_pattern = re.compile(r'([a-zA-Z0-9]{30,50})')
        if match := contract_address_pattern.search(message):
            return match.group(1)
        return None

    async def forward_messages(self):
        retries = 5
        while retries > 0:
            try:
                async with TelegramClient(phone_number, api_id, api_hash) as client:
                    await client.connect()
                    destination_chat_entity = await client.get_entity(destination_chat_username)
                    destination_chat_id = destination_chat_entity.id

                    @client.on(events.NewMessage(chats=source_chat_id))
                    async def source_handler(event):
                        if event.message:
                            message_text = event.message.text
                            top10_percentage = self.extract_top10_percentage(message_text)
                            contract_address = self.get_contract_address_from_message(message_text)

                            if top10_percentage is not None and top10_percentage < 50:
                                # Print the message and store the contract address
                                console.print(f"Message with TOP 10 below 50%: {message_text}")

                                if contract_address:
                                    self.contract_addresses[contract_address] = True
                                    console.print(f"Contract address stored: {contract_address}")

                                # Forward the message to the destination chat
                                await client.send_message(destination_chat_id, message_text)
                                console.print(f"Message forwarded to destination chat: {message_text}")

                            elif top10_percentage is not None and top10_percentage >= 50:
                                console.print("Top 10 percentage is 50% or higher, ignoring.")

                            elif contract_address and contract_address in self.contract_addresses:
                                # Send the contract address immediately to the sniper bot
                                response = requests.post(sniper_bot_buy_url, json={"contractAddress": contract_address})
                                if response.status_code == 200:
                                    console.print(f"Contract address extracted and sent: {contract_address}")
                                else:
                                    console.print(f"Failed to send contract address: {response.status_code}")

                                # Forward the message to the destination chat
                                await client.send_message(destination_chat_id, message_text)
                                console.print(f"Message forwarded to destination chat: {message_text}")

                                # Remove the contract address from memory
                                del self.contract_addresses[contract_address]

                    console.print("Listening for new messages...")
                    await client.run_until_disconnected()
                break
            except sqlite3.OperationalError as e:
                if "database is locked" in str(e):
                    console.print("Database is locked, retrying...")
                    time.sleep(1)
                    retries -= 1
                else:
                    raise

if __name__ == "__main__":
    forwarder = MessageForwarder()
    asyncio.run(forwarder.forward_messages())
