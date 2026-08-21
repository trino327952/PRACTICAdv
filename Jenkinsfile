pipeline {

    agent any

    tools {
        nodejs 'NodeJS-24'
    }

    options {
        timestamps()
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
    }

    environment {
        // Tu usuario de Docker Hub actualizado
        DOCKER_USER = 'vicente327'

        // Nombres locales y remotos para los contenedores Docker
        LOCAL_BACKEND_IMAGE   = 'proyecto-backend'
        LOCAL_FRONTEND_IMAGE  = 'proyecto-frontend'
        REMOTE_BACKEND_IMAGE  = 'proyecto-integrador-backend'
        REMOTE_FRONTEND_IMAGE = 'proyecto-integrador-frontend'

        // URL del microservicio del backend en Railway
        PUBLIC_BACKEND_URL    = 'https://railway.app'

        // Identificadores de infraestructura extraídos de tu consola
        RAILWAY_PROJECT_ID           = '37075425-4ea0-4f1a-a5fb-e49455eb4174'
        RAILWAY_ENVIRONMENT_ID       = '64907db1-12c4-4b21-91c4-20dbcc8acab9'
        RAILWAY_BACKEND_SERVICE_ID   = '92fe0ca7-47b4-4cda-9f07-f791e68c7d55'
        RAILWAY_FRONTEND_SERVICE_ID  = '2a6e2269-b339-4078-aa38-5300ce07491c'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend - Install') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Configuración DB') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'Railway-Postgres',
                                                  usernameVariable: 'DB_USER',
                                                  passwordVariable: 'DB_PASS')]) {
                    sh '''
                        set -eu

                        echo "========================================"
                        echo "CONFIGURACIÓN DE BASE DE DATOS"
                        echo "========================================"

                        export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@containers-us-west-123.railway.app:5432/railway?schema=public"
                        echo "Variable DATABASE_URL configurada para Railway PostgreSQL"
                    '''
                }
            }
        }

        stage('Backend - Prisma') {
            steps {
                dir('backend') {
                    sh 'npx prisma generate'
                }
            }
        }

        stage('Backend - Test') {
            steps {
                dir('backend') {
                    sh 'npm test'
                }
            }
        }

        stage('Frontend - Install') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Frontend - Lint') {
            steps {
                dir('frontend') {
                    sh 'npm run lint'
                }
            }
        }

        stage('Frontend - Build') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Docker - Validate') {
            steps {
                sh 'docker compose config --quiet'
            }
        }

        stage('Docker - Build') {
            steps {
                sh 'docker compose build --no-cache'
            }
        }

        stage('Docker - Verify Images') {
            steps {
                sh '''
                    set -eu

                    echo "Verificando imágenes construidas..."

                    docker image inspect "${LOCAL_BACKEND_IMAGE}:latest" > /dev/null
                    docker image inspect "${LOCAL_FRONTEND_IMAGE}:latest" > /dev/null

                    echo "Imágenes verificadas correctamente."
                '''
            }
        }

        stage('Docker - Publish') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'jenkins-u3',
                        usernameVariable: 'DOCKER_USER_CRED',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh '''
                        set -eu

                        echo "========================================"
                        echo "PUBLICACIÓN EN DOCKER HUB"
                        echo "========================================"

                        export DOCKER_CONFIG="$(mktemp -d)"
                        trap 'rm -rf "$DOCKER_CONFIG"' EXIT

                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER_CRED" --password-stdin

                        BACKEND_LATEST="${DOCKER_USER_CRED}/${REMOTE_BACKEND_IMAGE}:latest"
                        BACKEND_BUILD="${DOCKER_USER_CRED}/${REMOTE_BACKEND_IMAGE}:${BUILD_NUMBER}"

                        FRONTEND_LATEST="${DOCKER_USER_CRED}/${REMOTE_FRONTEND_IMAGE}:latest"
                        FRONTEND_BUILD="${DOCKER_USER_CRED}/${REMOTE_FRONTEND_IMAGE}:${BUILD_NUMBER}"

                        docker tag "${LOCAL_BACKEND_IMAGE}:latest" "$BACKEND_LATEST"
                        docker tag "${LOCAL_BACKEND_IMAGE}:latest" "$BACKEND_BUILD"

                        docker tag "${LOCAL_FRONTEND_IMAGE}:latest" "$FRONTEND_LATEST"
                        docker tag "${LOCAL_FRONTEND_IMAGE}:latest" "$FRONTEND_BUILD"

                        docker push "$BACKEND_LATEST"
                        docker push "$BACKEND_BUILD"

                        docker push "$FRONTEND_LATEST"
                        docker push "$FRONTEND_BUILD"

                        docker logout

                        echo "Imágenes publicadas correctamente en Docker Hub como vicente327."
                    '''
                }
            }
        }

        stage('Railway - CLI Check') {
            steps {
                sh '''
                    set -eu
                    echo "Verificando Railway CLI..."
                    npx -y @railway/cli --version
                '''
            }
        }

        stage('Railway - Redeploy Backend') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'railway-token',
                        variable: 'RAILWAY_TOKEN'
                    )
                ]) {
                    sh '''
                        set -eu

                        echo "========================================"
                        echo "REDEPLOY BACKEND EN RAILWAY"
                        echo "========================================"

                        npx -y @railway/cli redeploy --service "$RAILWAY_BACKEND_SERVICE_ID" --environment "$RAILWAY_ENVIRONMENT_ID" --yes

                        echo "Redeploy del backend solicitado correctamente."
                    '''
                }
            }
        }

        stage('Railway - Redeploy Frontend') {
            steps {
                withCredentials([
                    string(
                        credentialsId: 'railway-token',
                        variable: 'RAILWAY_TOKEN'
                    )
                ]) {
                    sh '''
                        set -eu

                        echo "========================================"
                        echo "REDEPLOY FRONTEND EN RAILWAY"
                        echo "========================================"

                        npx -y @railway/cli redeploy --service "$RAILWAY_FRONTEND_SERVICE_ID" --environment "$RAILWAY_ENVIRONMENT_ID" --yes

                        echo "Redeploy del frontend solicitado correctamente."
                    '''
                }
            }
        }
    }

    post {
        success {
            echo '========================================'
            echo 'PIPELINE SATISFACTORIO'
            echo '========================================'
            echo 'Backend probado correctamente'
            echo 'Frontend validado y construido'
            echo 'Imágenes Docker construidas'
            echo 'Imágenes publicadas en Docker Hub bajo el perfil vicente327'
            echo 'Redeploy solicitado para Backend en Railway'
            echo 'Redeploy solicitado para Frontend en Railway'
        }

        failure {
            echo '========================================'
            echo 'PIPELINE FALLIDO'
            echo '========================================'
            echo 'Revisar la primera etapa fallida y su consola de depuración.'
        }
    }
}

