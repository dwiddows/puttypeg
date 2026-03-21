
# python script for generating HTML files for pictures in a directory
# to make an online album
import string
import os
files = os.listdir('.')

pic_files = []
for file in files:
  if file[-3:] in ['jpg', 'JPG', 'jpeg', 'gif']:
    pic_files.append(file)

write_filename = None

i=0
for file in pic_files:
  if i % 5 == 0:
    if write_filename:
      next_filename =  'pics' + repr(i/5+1) + '.html'
      write_file.write('<a href="./' + next_filename + '">Next</a>\n')
      write_file.write("</BODY></HTML>")
      write_file.close()

    write_filename = 'pics' + repr(i/5) + '.html'
    write_file = open(write_filename, 'w')
    write_file.write("<HTML><BODY>")

  write_file.write("<img border=5 width=80% src='" + file + "'>")
  write_file.write("<br><br>")
  i=i+1
