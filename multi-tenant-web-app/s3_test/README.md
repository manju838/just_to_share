This folder is the structure s3 bucket is organised to create a app service.
S3 Bucket (visualisation.propall) <== http://propall.s3-website.ap-south-1.amazonaws.com
|___index.html                    <== This is just an empty homepage we can use for propall if needed, just extra file for AWS hosting to work
├───kerala-villa                  <== User 1
│   └───index.html                <== http://propall.s3-website.ap-south-1.amazonaws.com/kerala-villa/
│   └───assets
└───spanish-villa                 <== User 2
    └───index.html                <== http://propall.s3-website.ap-south-1.amazonaws.com/spanish-villa/
    └───assets

Todos:
DNS service (Route 53) to make the url more presentable like our shapespark ones => not working for visualisation.propall.tech/kerala-villa (Document not found error)
Cloudfront to add TLS certificate


Steps:

1) Bucket Policy for s3 bucket:

{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowPublicRead",
            "Effect": "Allow",
            "Principal": "*",
            "Action": [
                "s3:GetObject",
                "s3:PutObject"
            ],
            "Resource": "arn:aws:s3:::propall/*"
        }
    ]
}

2) Block Public Access: Off

3) Enable static web hosting

https://www.youtube.com/watch?v=o2HTkVxzivA

https://www.youtube.com/watch?v=X9cdkqBgLbs