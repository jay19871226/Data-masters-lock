Print "(v07 get servrr response status)" 
import requests

x = requests.get('' '')
print(x.status_code)
