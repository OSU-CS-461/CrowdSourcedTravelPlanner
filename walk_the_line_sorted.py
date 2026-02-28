import os
import datetime

def walk_the_line_sorted(root_dir):
    file_list = []

    for root, dirs, files in os.walk(root_dir):
        # Prune node_modules in-place
        dirs[:] = [d for d in dirs if d != 'node_modules']

        for file in files:
            full_path = os.path.join(root, file)
            try:
                mtime = os.path.getmtime(full_path)
                ctime = os.path.getctime(full_path)
                
                file_list.append({
                    'path': full_path,
                    'mtime': mtime,
                    'ctime': ctime
                })
            except OSError:
                continue

    # Sort by mtime (most recent first)
    # Use reverse=False for oldest first
    file_list.sort(key=lambda x: x['mtime'], reverse=0)

    for f in file_list:
        mod_date = datetime.datetime.fromtimestamp(f['mtime']).strftime('%Y-%m-%d %H:%M:%S')
        cre_date = datetime.datetime.fromtimestamp(f['ctime']).strftime('%Y-%m-%d %H:%M:%S')
        
        if mod_date.startswith('2026-02-'):
            print(f"File: {f['path']}")
            # print(f"  Created:  {cre_date}")
            print(f"  Modified: {mod_date}")
            print("-" * 30)

# Usage
walk_the_line_sorted('.')