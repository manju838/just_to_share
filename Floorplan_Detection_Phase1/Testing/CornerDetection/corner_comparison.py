"""


Evaluation of different edge detections
1) Canny
2) Sobel
3) Prewitt
4) Laplacian


Source https://www.geeksforgeeks.org/python-program-to-detect-the-edges-of-an-image-using-opencv-sobel-edge-detection/



Code Explanations:

1) __file__: This is a special variable in Python that contains the path to the script that is currently being executed. If you are running a script called example.py, __file__ would be example.py (or the full path to example.py if the script is not in the current directory).

2) os.path.realpath(path): This function returns the canonical path of the specified filename, eliminating any symbolic links encountered in the path. This means it resolves the absolute path of __file__.

3) os.path.dirname(path): This function returns the directory name of the given path. If you pass it a full file path, it will strip the file name and return the path of the directory containing that file.

"""

import cv2
import numpy as np
import os

example_image_path = (
    os.path.dirname(os.path.realpath(__file__)) + "/../../Example_Images/image_3.png"
)

# Read image and convert to grayscale
img = cv2.imread(example_image_path)
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

img_gaussian = cv2.GaussianBlur(gray, (3, 3), 0)

# canny
img_canny = cv2.Canny(img, 100, 200)

# sobel
img_sobelx = cv2.Sobel(img_gaussian, cv2.CV_8U, 1, 0, ksize=5)
img_sobely = cv2.Sobel(img_gaussian, cv2.CV_8U, 0, 1, ksize=5)
img_sobel = img_sobelx + img_sobely

# prewitt
kernelx = np.array([[1, 1, 1], [0, 0, 0], [-1, -1, -1]])
kernely = np.array([[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]])
img_prewittx = cv2.filter2D(img_gaussian, -1, kernelx)
img_prewitty = cv2.filter2D(img_gaussian, -1, kernely)
prewitt = img_prewittx + img_prewitty
laplacian = cv2.Laplacian(img, cv2.CV_64F)

cv2.imshow("Original Image", img)
cv2.imshow("Canny", img_canny)  # appears to be best

cv2.imshow("Sobel", img_sobel)
cv2.imshow("Sobel X", img_sobelx)
cv2.imshow("Sobel Y", img_sobely)

cv2.imshow("Prewitt X", img_prewittx)
cv2.imshow("Prewitt Y", img_prewitty)
cv2.imshow("Prewitt", prewitt)

cv2.imshow("laplacian", laplacian)  # second best

cv2.waitKey(0)
cv2.destroyAllWindows()