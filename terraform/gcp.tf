provider "google" {
  project = "prefab-conquest-186122"
}

resource "google_compute_global_address" "joeym-org-ip" {
  name = "joeym-org-ip"
}

resource "google_compute_global_forwarding_rule" "forwarding-rule" {
  name = "joeym-org"
  target = google_compute_target_http_proxy.http-proxy.self_link
  ip_address = google_compute_global_address.joeym-org-ip.self_link
  ip_protocol = "TCP"
  port_range = "80"
}

resource "google_compute_target_http_proxy" "http-proxy" {
  name    = "joeym-org"
  url_map = google_compute_url_map.url-map.id
}

resource "google_compute_global_forwarding_rule" "forwarding-rule-https" {
  name = "joeym-org-https"
  target = google_compute_target_https_proxy.https-proxy.self_link
  ip_address = google_compute_global_address.joeym-org-ip.self_link
  ip_protocol = "TCP"
  port_range = "443"
}

resource "google_compute_target_https_proxy" "https-proxy" {
  name    = "joeym-org"
  url_map = google_compute_url_map.url-map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.ssl_cert.id]
}

resource "google_compute_managed_ssl_certificate" "ssl_cert" {
  name = "joeym-org-cert"

  managed {
    domains = ["joeym.org"]
  }
}

resource "google_compute_url_map" "url-map" {
  name            = "joeym-org"
  default_service = google_compute_backend_bucket.backend-bucket.id

  host_rule {
    hosts        = ["joeym.org"]
    path_matcher = "allpaths"
  }


  path_matcher {
    name            = "allpaths"
    default_service = google_compute_backend_bucket.backend-bucket.id

    path_rule {
      paths = ["/resume"]
      url_redirect {
        host_redirect = "docs.google.com"
        https_redirect = true
        path_redirect = "/document/d/e/2PACX-1vTULD7-CDdmj6nHF3EhLIUp9rq-od86fiPu2KZdYVgoDbdWKVkysvhwF-AqSkGGot-LCXY3tEITFi9R/pub"
        strip_query = true
      }
    }
  }
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