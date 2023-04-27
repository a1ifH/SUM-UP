# SUM-UP

---
### Project Members: 
| Name           | Email |
| -----------    | ----------- |
| Zubair Asif    | muhammad.asif2@mail.dcu.ie       |
| Alif Hossain   | alif.hossain5@mail.dcu.ie        |

### Project Supervisor:
| Name           | Email |
| -----------    | ----------- |
| Prof Gareth Jones    | gareth.jones@dcu.ie       |



---


### About
This project investigates a method for automatically generating podcast audio summaries. This project is a web application that concentrates on extractive summaries, which are created by selecting a collection of pertinent audio parts from a podcast without changing or altering the original material. Before listening to the full episode, such summaries would educate the viewer about the podcast's subjects. The project should point out that the goal is not to offer the viewer a shortened version of the entire show, but rather to give an overview in the style of a film teaser.

---

### Installation Guide
Step 1: Visit Repo

> Go to the gitlab repository: https://gitlab.computing.dcu.ie/asifm2/2023-ca400-asifm2-hossaia5/-/tree/master/src<br>
> Click the Clone button and use the clone with HTTPS

Step 2: Clone

> Clone the repository to your local machine using the following command
> ```shell
>git clone https://gitlab.computing.dcu.ie/asifm2/2023-ca400-asifm2-hossaia5.git


Step 3: Build Frontend

> You will need to build frontend by using the command (within the frontend directory)
>```shell
> yarn install
> yarn build

Step 4: Build Docker

> You will need to build docker using the following command (must exit frontend directory)
>```shell
>docker-compose build
>docker-compose up -d

Step 5: Access the Application

> You can view the app running on the following link
>```shell
>localhost:5005
