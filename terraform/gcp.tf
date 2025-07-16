provider "google" {
  project = "prefab-conquest-186122"
}

resource "google_compute_global_address" "my_ip" {
  name = "joeym-org-ip"
}

resource "google_compute_global_forwarding_rule" "forwarding-rule" {
  name = "joeym-org"
  target = google_compute_target_http_proxy.http-proxy.self_link
  ip_address = google_compute_global_address.my_ip.self_link
  ip_protocol = "TCP"
  port_range = "80"
}

resource "google_compute_target_http_proxy" "http-proxy" {
  name    = "joeym-org"
  url_map = google_compute_url_map.url-map.id
}

resource "google_compute_url_map" "url-map" {
  name            = "joeym-org"
  default_service = google_compute_backend_bucket.backend-bucket.id
}

resource "google_compute_backend_bucket" "backend-bucket" {
  name        = "joeym-org"
  bucket_name = google_storage_bucket.bucket.name
  enable_cdn  = true
}

resource "google_storage_bucket" "bucket" {
  name = "joeym-org-main-website"
  location = "US"
}