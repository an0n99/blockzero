import re
import asyncio
import aiohttp
from telethon import TelegramClient, events
from telethon.errors import SessionPasswordNeededError

# Define the API ID, API hash, and phone number for the Telegram client
api_id = 'YOUR_API_ID'
api_hash = 'YOUR_API_HASH'
phone_number = 'YOUR_PHONE_NUMBER'

# Define the source chat ID
source_chat_id = 'SOURCE_CHAT_ID'

# URL of the JavaScript bot server
sniper_bot_url = 'http://localhost:3000/buy'

# Set to store seen contract addresses
seen_contract_addresses = set()

# Function to extract phrases from a message
def extract_phrases(message):
    text = message.raw_text
    return bool(re.search(r'#1|#2|#3', text) and '🚨' not in text)

# Function to extract liquidity percentage from message
def extract_liquidity_percentage(message_text):
    lines = message_text.split('\n')
    liquidity_line = next((line for line in lines if 'Liq' in line), None)
    if liquidity_line:
        try:
            return float(liquidity_line.split('(')[-1].split('%')[0])
        except (ValueError, IndexError):
            pass
    return None

# Function to extract contract address from message
def extract_contract_address(message_text):
    match = re.search(r'[a-zA-Z0-9]{30,50}', message_text)
    return match.group(0) if match else None

# Initialize the Telegram client
client = TelegramClient('session_name', api_id, api_hash)

@client.on(events.NewMessage(chats=source_chat_id))
async def handler(event):
    if extract_phrases(event.message):
        message_text = event.message.raw_text

        # Extract liquidity percentage from message
        liquidity_percentage = extract_liquidity_percentage(message_text)
        if liquidity_percentage is not None:
            if liquidity_percentage > 200.00 or liquidity_percentage < 5.00:
                print(f"Message not forwarded: liquidity percentage is {liquidity_percentage}%.")
                return

        # Extract contract address from message
        contract_address = extract_contract_address(message_text)
        if contract_address and contract_address not in seen_contract_addresses:
            async with aiohttp.ClientSession() as session:
                async with session.post(sniper_bot_url, json={'contractAddress': contract_address}) as resp:
                    if resp.status == 200:
                        print(f"Forwarded contract address: {contract_address}")
                        seen_contract_addresses.add(contract_address)
                    else:
                        print(f"Failed to forward contract address: {contract_address}, Status: {resp.status}")
        else:
            print(f"Duplicate or no contract address found in message")

async def main():
    await client.start(phone_number)
    print("Client started")

    if not await client.is_user_authorized():
        try:
            await client.send_code_request(phone_number)
            await client.sign_in(phone_number, input('Enter the code: '))
        except SessionPasswordNeededError:
            await client.sign_in(password=input('Password: '))

    print("Client authorized")
    await client.run_until_disconnected()
    print("Client disconnected")

# Run the main function
loop = asyncio.get_event_loop()
loop.run_until_complete(main())
