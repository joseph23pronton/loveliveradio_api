import xml.etree.ElementTree as ET
import requests

# URL of the XML data
url = "https://gma.ganbaruby23.xyz/mobile/?command=get_xmltv_epg"

# Fetch the XML data from the URL
response = requests.get(url)
xml_data = response.content

# Parse the XML data
root = ET.fromstring(xml_data)

# Create a dictionary to map channel id to display name
channel_map = {}
for channel in root.findall('channel'):
    channel_id = channel.get('id')
    display_name = channel.find('display-name').text
    channel_map[channel_id] = display_name
    
    # Replace the channel id with the display name
    channel.set('id', display_name)

# Update the programme tags with the new channel names
for programme in root.findall('programme'):
    channel_id = programme.get('channel')
    if channel_id in channel_map:
        programme.set('channel', channel_map[channel_id])
    
    # Append +0000 to the start and stop attributes
    start_time = programme.get('start')
    stop_time = programme.get('stop')
    programme.set('start', start_time + " +0000")
    programme.set('stop', stop_time + " +0000")

# Convert back to string
updated_xml = ET.tostring(root, encoding='unicode')

# Save the modified XML to a file
with open("updated_epg.xml", "w") as file:
    file.write(updated_xml)

print("Updated XML has been saved to 'updated_epg.xml'")
