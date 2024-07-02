import re
from telethon import TelegramClient, events
import requests  # Add this import

# Function to extract contract address from message
def extract_contract_address(message_text):
    match = re.search(r'[a-zA-Z0-9]{30,50}', message_text)
    if match:
        return match.group(0)
    return None

async def main():
    # Your Telegram API credentials
    api_id = 123456  # Replace with your API ID
    api_hash = 'your_api_hash'  # Replace with your API hash
    phone_number = '+1234567890'  # Format: '+CountryCodePhoneNumber'

    # Initialize the Telegram client
    client = TelegramClient('session_name', api_id, api_hash)

    # Connect to Telegram
    await client.start(phone=phone_number)

    source_chat_id = -1002075630283  # Source chat ID
    destination_channel_username = '@soul_scanner_bot'  # Destination channel username

    # URL of your JavaScript bot's HTTP server
    js_bot_url = "http://localhost:3000/api/buy"  # Replace with your actual URL

    # Function to fetch and print the next message in the destination chat
    async def print_next_message(event):
        async for message in client.iter_messages(destination_channel_username, limit=1, offset_id=event.id):
            print(f"Next message in destination chat: {message.text}")
            return message  # Return the next message

    # Set up event handler for new messages in the source chat
    @client.on(events.NewMessage(chats=source_chat_id))
    async def handler(event):
        if "Token info updated" in event.raw_text:
            print(f"Message received in source chat: {event.raw_text}")

            contract_address = extract_contract_address(event.raw_text)
            if contract_address:
                print(f"Extracted contract address: {contract_address}")

                try:
                    # Forward the contract address to the destination channel
                    await client.send_message(destination_channel_username, contract_address)
                    print(f"Contract address {contract_address} forwarded to destination channel.")

                    # Print the next message in the destination chat and check for 🚨 emoji
                    next_message = await print_next_message(event)
                    if next_message:
                        if '🚨' in next_message.raw_text:
                            # If the next message contains 🚨, do not send to JS bot
                            print(f"Message contains 🚨 emoji, skipping forwarding to JS bot.")
                        else:
                            # If the next message does not contain 🚨, send the contract address to JS bot
                            response = requests.post(js_bot_url, json={"contractAddress": contract_address})
                            if response.status_code == 200:
                                print(f"Contract address {contract_address} sent to JS bot successfully.")
                            else:
                                print(f"Failed to send contract address to JS bot: {response.text}")

                except Exception as e:
                    print(f"Error sending message to destination channel or checking subsequent message: {e}")

    print("Listening for new messages in the source chat...")
    await client.run_until_disconnected()

if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
