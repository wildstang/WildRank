use std::env;
use std::fs;
use base64;
use glob::glob;
use std::path::Path;
use std::thread;
use std::io::prelude::*;
use std::net::TcpListener;
use std::net::TcpStream;

fn main() {
    let mut args: Vec<String> = env::args().collect();
    args.remove(0); // remove command
    
    // parse command line arguments
    let mut port = String::from("8000");
    let mut addr = String::from("0.0.0.0");
    let mut last = String::from("");
    for arg in args {
        if last == "addr" {
            addr = arg.clone();
        }
        else if last == "port" {
            port = arg.clone();
        }
        last = arg.clone();
    }

    // bind port
    let address = format!("{}:{}", addr, port);
    println!("Starting server at: {}", address);
    let listener = TcpListener::bind(address).unwrap();

    // handle requests
    for stream in listener.incoming() {
        let stream = stream.unwrap();

        thread::spawn(|| {
            handle_connection(stream);
        });
    }
}

fn handle_connection(mut stream: TcpStream) {
    let mut buffer = [0; 1024];
    stream.read(&mut buffer).unwrap();
    let header = String::from_utf8_lossy(&buffer[..]);
    println!("{}", header);

    if buffer.starts_with(b"GET /") {
        // get requested page
        let parts: Vec<&str> = header.split_whitespace().collect();
        let mut req = &parts[1][1..];
        let qparts: Vec<&str> = req.split('?').collect();
        req = &qparts[0];
        //println!("Request: {}", req);

        // convert root request to index.html
        if req.len() == 0 || req.starts_with("?") {
            req = "index.html";
        }
        // return result lists
        else if req.starts_with("get") {
            // build filter
            let mut ext = "json";
            let start: &str;
            match req {
                "getPitResultsNames" => start = "pit",
                "getImageNames" => {
                    start = "image";
                    ext = "png"
                },
                "getMatchResultNames" => start = "match",
                "getNoteNames" => start = "note",
                _ => start = "", // return 404
            }

            if start.len() > 0 {
                let filter = format!("uploads/{}-*.{}", start, ext);

                // filter available results
                let mut contents = String::from("");
                for entry in glob(&filter).expect("Failed to read glob pattern") {
                    match entry {
                        Ok(path) => contents.push_str(&format!("{},", path.display())),
                        Err(e) => println!("{:?}", e),
                    }
                }

                return send_str_response(stream, "200 OK", "text/csv", &contents);
            }
        }
        // return about page
        else if req == "about" {
            let contents = "<!DOCTYPE html>\
                <html lang=\"en\">\
                    <head>\
                        <meta charset=\"utf-8\"/>\
                        <title>LiamRank</title>\
                    </head>\
                    <body>\
                        <h1>Liam Rank</h1>\
                        post-server.py Python3 POST server<br>2020 Liam Fruzyna<br><a href=\"https://github.com/mail929/LiamRank\">MPL Licensed on GitHub</a>\
                    </body>\
                </html>";
            return send_str_response(stream, "200 OK", "text/html", contents);
        }
        // return TBA API key
        else if req == "scripts/keys.js" {
            let api_key = env::var("TBA_KEY").unwrap_or("none".to_string());
            if api_key.len() > 0 {
                return send_str_response(stream, "200 OK", "text/js", &format!("API_KEY=\"{}\"", api_key));
            }
        }

        // return 404 if file does not exist
        if !Path::new(req).exists() {
            return send_str_response(stream, "404 NOT FOUND", "text/html", "<h1>404 - Page Not Found!</h1>");
        }

        // determine if file is intended to be hosted
        let valid_paths: [&str; 8] = ["config", "scripts", "styles", "uploads", "favicon.ico", "index.html", "selection.html", "?"];
        let mut allowed = false;
        for path in valid_paths.to_vec() {
            if req.starts_with(path) {
                allowed = true;
                break;
            }
        }
        if !allowed {
            return send_str_response(stream, "401 UNAUTHORIZED", "text/html", "<h1>401 - Unauthorized!</h1>");
        }

        // return file if it does exist
        let ext = &req[(req.len()-3)..];
        let mime: &str;
        match ext {
            "ico" => mime = "image/x-icon",
            "jpg" => mime = "image/jpeg",
            "png" => mime = "image/png",
            "svg" => mime = "image/svg+xml",
            "tml" => mime = "text/html",
            "css" => mime = "text/css",
            ".js" => mime = "application/javascript",
            "son" => mime = "text/plain",
            _ => mime = "text/plain",
        }

        // send file
        if mime.starts_with("image") {
            send_bytes_response(stream, "200 OK", mime, fs::read(req).unwrap());
        }
        else {
            send_str_response(stream, "200 OK", mime, &fs::read_to_string(req).unwrap());
        }
    }
    else if buffer.starts_with(b"POST /") {
        let parts: Vec<&str> = header.split('\n').collect();
        for line in parts {
            let keyval: Vec<&str> = line.split(": ").collect();
            if keyval.len() == 2 && keyval[0] == "Content-Length" {
                // determine length of body
                let val = &keyval[1][..keyval[1].len()-1];
                let len: usize = val.parse().unwrap();

                // read body into buffer
                let mut data_buffer = Vec::new();
                let mut total_read = 0;
                while total_read < len {
                    let mut read_len = len - total_read;
                    if read_len > 1024 {
                        read_len = 1024;
                    }
                    let mut read_buffer = vec![0; read_len];
                    total_read += stream.read(&mut read_buffer).unwrap();
                    data_buffer.extend(read_buffer);
                }

                // parse buffer
                let upload = String::from_utf8_lossy(&data_buffer[..]);
                let parts: Vec<&str> = upload.split("|||").collect();
                let file = parts[0];
                let data = parts[1];
                //println!("File: {}", file);
                //println!("Data: {}", data);

                // save file
                if data.starts_with("data:image/png;base64,") {
                    let image = &data[22..];
                    let decoded = base64::decode(image).unwrap();
                    let name = format!("uploads/{}.png", file);
                    fs::write(name, decoded).expect("Unable to write file");
                }
                else {
                    let name = format!("uploads/{}.json", file);
                    fs::write(name, data).expect("Unable to write file");
                }
            }
        }
        send_str_response(stream, "200 OK", "text/html", "<h1>Got POST</h1>");
    }
    else {
        send_str_response(stream, "400 BAD REQUEST", "text/html", "<h1>400 - Bad Request!</h1>");
    }
}

// above function, plus a defined mime type
fn send_str_response(mut stream: TcpStream, response: &str, mime_type: &str, contents: &str) {
    let response = format!("HTTP/1.1 {}\r\nContent-Length: {}\r\nContent-type: {}\r\n\r\n{}", response, contents.len(), mime_type, contents);
    stream.write(response.as_bytes()).unwrap();
    stream.flush().unwrap();
}

// above function, plus a defined mime type
fn send_bytes_response(mut stream: TcpStream, response: &str, mime_type: &str, contents: Vec<u8>) {
    let response = format!("HTTP/1.1 {}\r\nContent-Length: {}\r\nContent-type: {}\r\n\r\n", response, contents.len(), mime_type);
    let mut byte_res = response.into_bytes();
    byte_res.extend_from_slice(&contents);
    stream.write(&byte_res).unwrap();
    stream.flush().unwrap();
}