import os
import datetime

def walk_the_line(root_dir):
    for root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d != 'node_modules']

        for file in files:
            full_path = os.path.join(root, file)
            
            try:
                mtime = os.path.getmtime(full_path)
                ctime = os.path.getctime(full_path)
                mod_date = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
                cre_date = datetime.datetime.fromtimestamp(ctime).strftime('%Y-%m-%d %H:%M:%S')
                
                content = ""
                with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()

                print(f"File: {full_path}")
                print(f"  Created:  {cre_date}")
                print(f"  Modified: {mod_date}")
                print(f"  Content:\n{content}")
                print("-" * 50)
                
            except Exception as e:
                print(f"Error accessing or reading {full_path}: {e}")

if __name__ == '__main__':
    walk_the_line('.')