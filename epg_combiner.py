import xml.etree.ElementTree as ET
import requests
import os
from datetime import datetime
import copy

# Configuration
EPG_URLS = [
    "https://raw.githubusercontent.com/joseph23pronton/loveliveradio_api/refs/heads/main/updated_epg.xml",
    "https://raw.githubusercontent.com/atone77721/CIGNAL_EPG/refs/heads/main/sky_epg.xml",
    "https://raw.githubusercontent.com/pigzillaaaaa/blast-epg/refs/heads/main/blast-epg.xml",
    "https://raw.githubusercontent.com/atone77721/CIGNAL_EPG/refs/heads/main/cignal_epg.xml",
    "https://kaotv.ganbaruby23.xyz/epg.xml",
]
COMBINED_EPG_FILE = "combined_epg.xml"
REQUEST_TIMEOUT = 15  # seconds

def get_programme_key(programme_element):
    """
    Generates a unique key for a programme element based on start, stop times, and title.
    """
    start = programme_element.get('start', '')
    stop = programme_element.get('stop', '')
    title_element = programme_element.find('title')
    title = title_element.text if title_element is not None and title_element.text is not None else ''
    return (start, stop, title)

def log_message(message):
    """Prints a message with a timestamp."""
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}")

def load_existing_epg(filepath):
    """
    Loads EPG data from an existing XML file.
    Returns a dictionary: {'channels': {id: element}, 'programmes': {channel_id: {prog_key: element}}}
    """
    existing_data = {'channels': {}, 'programmes': {}}
    if not os.path.exists(filepath):
        log_message(f"No existing EPG file found at '{filepath}'. Starting fresh.")
        return existing_data

    try:
        log_message(f"Loading existing EPG data from '{filepath}'...")
        tree = ET.parse(filepath)
        root = tree.getroot()

        for channel_element in root.findall('channel'):
            channel_id = channel_element.get('id')
            if channel_id:
                existing_data['channels'][channel_id] = channel_element

        for programme_element in root.findall('programme'):
            channel_id = programme_element.get('channel')
            if channel_id: # Only consider programmes with a channel
                prog_key = get_programme_key(programme_element)
                if channel_id not in existing_data['programmes']:
                    existing_data['programmes'][channel_id] = {}
                existing_data['programmes'][channel_id][prog_key] = programme_element
        log_message("Successfully loaded existing EPG data.")
    except ET.ParseError:
        log_message(f"Error parsing existing EPG file '{filepath}'. It might be corrupted. Starting fresh.")
        return {'channels': {}, 'programmes': {}} # Return empty if parse error
    except Exception as e:
        log_message(f"An unexpected error occurred while loading '{filepath}': {e}. Starting fresh.")
        return {'channels': {}, 'programmes': {}}
    return existing_data

def fetch_epg_from_url(url):
    """Fetches and parses EPG XML from a given URL."""
    log_message(f"Fetching EPG data from {url}...")
    try:
        response = requests.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()  # Raises an HTTPError for bad responses (4XX or 5XX)
        xml_content = response.content
        if not xml_content:
            log_message(f"Warning: Empty content received from {url}.")
            return None
        return ET.fromstring(xml_content)
    except requests.exceptions.Timeout:
        log_message(f"Error: Timeout while fetching {url}.")
    except requests.exceptions.HTTPError as e:
        log_message(f"Error: HTTP error fetching {url}: {e}")
    except requests.exceptions.RequestException as e:
        log_message(f"Error: Could not fetch EPG data from {url}: {e}")
    except ET.ParseError as e:
        log_message(f"Error: Could not parse XML from {url}: {e}")
    except Exception as e:
        log_message(f"An unexpected error occurred while processing {url}: {e}")
    return None

def main():
    # Load existing combined EPG data (our cache)
    # Deepcopy to ensure we are not modifying the cache elements directly unless intended
    final_data = copy.deepcopy(load_existing_epg(COMBINED_EPG_FILE))

    # Keep track of channel IDs whose programmes have been fully refreshed from a live source.
    # This ensures that if a channel's schedule is updated by ANY live source,
    # its entire cached schedule is wiped first, then rebuilt from all live sources
    # that provide data for it.
    live_updated_programme_channels = set()

    for url in EPG_URLS:
        new_root = fetch_epg_from_url(url)
        if new_root is not None:
            log_message(f"Successfully fetched and parsed EPG from {url}.")

            # Process channels from this source
            current_source_channel_ids = set()
            for channel_element in new_root.findall('channel'):
                channel_id = channel_element.get('id')
                if channel_id:
                    # Add or overwrite channel definition in final_data
                    final_data['channels'][channel_id] = channel_element
                    current_source_channel_ids.add(channel_id)

            # Process programmes from this source
            # Group programmes from the current source by channel_id first
            programmes_from_current_source = {}
            for programme_element in new_root.findall('programme'):
                channel_id = programme_element.get('channel')
                if channel_id and channel_id in final_data['channels']: # Process only for known/added channels
                    if channel_id not in programmes_from_current_source:
                        programmes_from_current_source[channel_id] = []
                    programmes_from_current_source[channel_id].append(programme_element)

            # Now, merge these programmes into final_data
            for channel_id, new_programmes_list in programmes_from_current_source.items():
                if channel_id not in live_updated_programme_channels:
                    # This is the first live data for this channel's programmes in this run.
                    # Clear any existing (cached or from prior URL in this run) programmes.
                    final_data['programmes'].pop(channel_id, None)
                    live_updated_programme_channels.add(channel_id)

                # Ensure the programme dictionary for this channel exists
                if channel_id not in final_data['programmes']:
                    final_data['programmes'][channel_id] = {}

                # Add new programmes, overwriting by key (start, stop, title)
                for programme_element in new_programmes_list:
                    prog_key = get_programme_key(programme_element)
                    final_data['programmes'][channel_id][prog_key] = programme_element
        else:
            log_message(f"Failed to fetch or parse EPG from {url}. "
                        f"Existing data for channels from this source (if any) will be retained if not updated by other sources.")

    # Build the output XML
    output_root = ET.Element('tv')
    output_root.set('generator-info-name', 'EPGCombiner')
    output_root.set('generator-info-date', datetime.now().strftime('%Y-%m-%dT%H:%M:%SZ'))

    # Add all unique channels, sorted by ID
    sorted_channel_ids = sorted(final_data['channels'].keys())
    for channel_id in sorted_channel_ids:
        output_root.append(final_data['channels'][channel_id])

    # Add programmes for these channels
    for channel_id in sorted_channel_ids: # Iterate in same order as channels for consistency
        if channel_id in final_data['programmes'] and final_data['channels'].get(channel_id) is not None:
            # Get all programme elements for the channel
            programme_elements_for_channel = list(final_data['programmes'][channel_id].values())

            # Sort programmes by start time
            try:
                # Ensure 'start' attribute exists for sorting, provide a default if not (though unlikely for valid EPG)
                sorted_programmes = sorted(
                    programme_elements_for_channel,
                    key=lambda p: p.get('start', '')
                )
            except TypeError: # Handles cases where p.get('start') might return None if XML is malformed
                 log_message(f"Warning: Could not sort programmes for channel {channel_id} due to missing/invalid 'start' times. Appending unsorted.")
                 sorted_programmes = programme_elements_for_channel


            for programme_element in sorted_programmes:
                output_root.append(programme_element)

    # Write the combined EPG to a file
    try:
        tree = ET.ElementTree(output_root)
        # Pretty print the XML (available in Python 3.9+)
        if hasattr(ET, 'indent'):
            ET.indent(tree, space="  ", level=0)
        tree.write(COMBINED_EPG_FILE, encoding='UTF-8', xml_declaration=True)
        log_message(f"Successfully combined EPG data into '{COMBINED_EPG_FILE}'.")
        log_message(f"Total channels: {len(final_data['channels'])}")
        total_programmes = sum(len(progs) for progs in final_data['programmes'].values())
        log_message(f"Total programmes: {total_programmes}")

    except Exception as e:
        log_message(f"Error writing combined EPG file: {e}")

if __name__ == '__main__':
    main()
