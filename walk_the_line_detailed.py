import os
import datetime

def walk_the_line(root_dir):
    for root, dirs, files in os.walk(root_dir):
        # The Secret Sauce: Modify 'dirs' in place to exclude node_modules
        # This prevents os.walk from recursing into them
        dirs[:] = [d for d in dirs if d != 'node_modules']

        for file in files:
            full_path = os.path.join(root, file)
            
            if 'node_modules' not in full_path:
                try:
                    mtime = os.path.getmtime(full_path)
                    ctime = os.path.getctime(full_path)
                    
                    mod_date = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
                    cre_date = datetime.datetime.fromtimestamp(ctime).strftime('%Y-%m-%d %H:%M:%S')
                
                    print(f"File: {full_path}")
                    print(f"  Created:  {cre_date}")
                    print(f"  Modified: {mod_date}")
                    print("-" * 30)
                
                except OSError:
                    print(f"Error accessing {full_path}")

# Usage
walk_the_line('.')