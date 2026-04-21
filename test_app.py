from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

driver = webdriver.Chrome()

BASE = "file:///C:/Users/VIRAL/Desktop/SECIPAT"

driver.get(BASE + "/index.html")

wait = WebDriverWait(driver, 10)
wait.until(EC.presence_of_element_located((By.ID, "username")))

print("✅ Page loaded")
time.sleep(10)
# Open login page
driver.get(BASE + "/index.html")

wait = WebDriverWait(driver, 10)

# Wait until input appears
wait.until(EC.presence_of_element_located((By.ID, "username")))

# Login
driver.find_element(By.ID, "username").send_keys("testuser")
driver.find_element(By.ID, "password").send_keys("1234")
driver.find_element(By.ID, "loginBtn").click()

# Wait for dashboard
wait.until(EC.url_contains("dashboard.html"))

print("✅ Login Test Passed")
time.sleep(10)

# LEAVE TEST
# =========================
driver.get(BASE + "/leave.html")

wait.until(EC.presence_of_element_located((By.ID, "applyBtn")))

driver.find_element(By.ID, "date").send_keys("2026-06-01")
driver.find_element(By.ID, "reason").send_keys("Sick leave")
driver.find_element(By.ID, "applyBtn").click()

# Wait for table update
time.sleep(10)

rows = driver.find_elements(By.CSS_SELECTOR, "#leave-body tr")
assert len(rows) > 0

print("✅ Leave Test Passed")
time.sleep(10)

# CHAT TEST
# =========================
driver.get(BASE + "/chat.html")

wait.until(EC.presence_of_element_located((By.ID, "sendBtn")))

driver.find_element(By.ID, "msg").send_keys("Hello Mentor")
driver.find_element(By.ID, "sendBtn").click()

time.sleep(10)

messages = driver.find_elements(By.CLASS_NAME, "message")

assert any("Hello Mentor" in m.text for m in messages)

print("✅ Chat Test Passed")
time.sleep(10)
# Go to report page
driver.get(BASE + "/report.html")

wait.until(EC.presence_of_element_located((By.ID, "genBtn")))
driver.find_element(By.ID, "genBtn").click()

# Check report generated
wait.until(EC.text_to_be_present_in_element((By.ID, "reportData"), "Student Name"))

print("✅ Report Test Passed")

time.sleep(10)
driver.quit()