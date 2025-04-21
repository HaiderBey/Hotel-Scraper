import requests # To fetch html
from bs4 import BeautifulSoup # To extract parts of html
import pandas as pd
from selenium import webdriver
from datetime import datetime
from pathlib import Path

url = "https://tn.tunisiebooking.com"

def collectLinks(html, listName, destination): #khater fama 3 divs w n7eb njib ken zouz bel ID
    container = html.find("div", {"id":destination})
    
    for dest_elem in container.find_all("a"):
        link = dest_elem.get('href')
        if link != "#":
            listName.append(link)

response = requests.get(url)

dest_links = [] #destination links
if response.status_code == 200:
    soup = BeautifulSoup(response.content, "html.parser")

    collectLinks(soup, dest_links, "top_destination")
    collectLinks(soup, dest_links, "autre_hotels")

hotels_data = []

driver = webdriver.Chrome()

for link in dest_links:

    driver.get(link)
    
    # while True:
    #     try:
    #         see_more = WebDriverWait(driver, 5).until(EC.element_to_be_clickable((By.XPATH, "//u[contains(., 'Voir plus')]")))
    #         see_more.click()
    #         time.sleep(2)
    #     except:
    #         break


    dest_content = BeautifulSoup(driver.page_source, "html.parser")
    
    hotel_cards = dest_content.find_all('div', class_ = 'un_destination')

    for card in hotel_cards:
        name_elem = card.find('div', class_ = 'titre-hotel')
        name = name_elem.text.strip() if name_elem else 'N/A'
        
        img_elem = card.find('img')
        image = img_elem.get('src') if img_elem else "N/A"
        
        """
        https://dummyimage.com/374.2%20x%20252/ededed/404040.jpg&text=No+Image+Provided
        Link for "No Image Provided" image (for future use)
        """
        
        price_elem = card.find('div', class_ = 'note-adresse-hotel')
        price = price_elem.find('span').text.strip() if price_elem else 'N/A'

        #Note tripad also contains trip advisor icon if needed for future use
        rate_elem = card.find('div', class_ = 'note-tripad')
        rate = rate_elem.find('span').text.strip() if rate_elem else '?/5'

        hotel_destination_elem = dest_content.find('form', {'id': 'hotel'})
        hotel_destination = hotel_destination_elem.find('span').text.replace('Hôtels ', '').strip()

        hotels_data.append({
            'Name': name,
            'Image': image,
            'Price' : price,
            'Rate' : rate,
            'Destination' : hotel_destination,
            'Link': link
        })

driver.quit()


df = pd.DataFrame(hotels_data)
timestamp = datetime.now().strftime("%Y%m%d_%H%M")

output_path = Path("data") / f"tunisie_booking_hotels_{timestamp}.csv"
df.to_csv(output_path, index=False, encoding='utf-8-sig')

